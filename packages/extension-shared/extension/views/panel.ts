/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Diagnostic,
  DiagnosticSeverity,
  type Disposable,
  type ExtensionContext,
  languages,
  Position,
  Range,
  type TextDocument,
  type TextEditor,
  Uri,
  ViewColumn,
  type WebviewPanel,
  window,
  workspace,
} from "vscode";
import { type JSONTableSchema } from "shared/types/tableSchema";
import { DiagnosticError } from "shared/types/diagnostic";

import { DIAGRAM_UPDATER_DEBOUNCE_TIME } from "../constants";
import { ExtensionConfig } from "../helper/extensionConfigs";
import { type ExtensionRenderProps } from "../types";

import { WebviewHelper } from "./helper";

export class MainPanel {
  public static currentPanel: MainPanel | undefined;
  private readonly _panel: WebviewPanel;
  public static extensionConfig: ExtensionConfig;
  private readonly _disposables: Disposable[] = [];
  // to add debouncing on diagram update after a file change
  private _lastTimeout: NodeJS.Timeout | null = null;
  public static parseCode: (code: string) => JSONTableSchema;
  public static fileExt: string;
  public static lastDocument: TextDocument | undefined;
  public static diagnosticCollection =
    languages.createDiagnosticCollection("dbml");

  private constructor(
    panel: WebviewPanel,
    context: ExtensionContext,
    extensionConfigSession: string,
  ) {
    this._panel = panel;
    this._panel.onDidDispose(
      () => {
        this.dispose();
      },
      null,
      this._disposables,
    );

    const extensionConfig = new ExtensionConfig(extensionConfigSession);
    const defaultPageConfig = extensionConfig.getDefaultPageConfig();

    // compute persisted data asynchronously and then set up the webview
    const webview = this._panel.webview;
    const disposables = this._disposables;
    const extConfig = extensionConfig;

    void (async () => {
      const persistedData: Record<string, unknown> = {};
      try {
        const wsFolder = workspace.workspaceFolders?.[0]?.uri;
        if (wsFolder !== undefined) {
          const dbmlDir = Uri.joinPath(wsFolder, ".DBML");
          try {
            const entries = await workspace.fs.readDirectory(dbmlDir);
            console.log("[MainPanel] Found .DBML directory with entries:", entries.length);
            for (const [name] of entries) {
              if (name.endsWith('.json')) {
                try {
                  const fileUri = Uri.joinPath(dbmlDir, name);
                  const data = await workspace.fs.readFile(fileUri);
                  const text = new TextDecoder().decode(data);
                  const key = name.replace(/\.json$/, '').replace(/__/g, ':');
                  persistedData[key] = JSON.parse(text);
                  console.log("[MainPanel] Loaded persisted data - file:", name, "key:", key, "entries:", Array.isArray(persistedData[key]) ? (persistedData[key] as unknown[]).length : "not array");
                } catch (e) {
                  // ignore file parse errors
                  console.error('[MainPanel] Failed to read persisted file', name, e);
                }
              }
            }
          } catch {
            // no .DBML folder yet
            console.log("[MainPanel] No .DBML directory found");
          }
        }
      } catch (e) {
        console.error('[MainPanel] Failed to collect persisted data for webview', e);
      }

      console.log("[MainPanel] Total persisted keys to inject:", Object.keys(persistedData).length, "keys:", Object.keys(persistedData));

      const html = WebviewHelper.setupHtml(
        webview,
        context,
        defaultPageConfig,
        persistedData,
      );

      webview.html = html;

      WebviewHelper.setupWebviewHooks(
        webview,
        extConfig,
        disposables,
        MainPanel.refreshCurrentSchema,
      );
    })();
  }

  /**
   * listen for file changes and update the diagram
   */
  public static registerDiagramUpdaterOnfFileChange(): void {
    const disposable = workspace.onDidChangeTextDocument(async (event) => {
      if (event.document.languageId === MainPanel.fileExt) {
        if (MainPanel.currentPanel?._lastTimeout !== null) {
          clearTimeout(MainPanel.currentPanel?._lastTimeout);
        }

        if (MainPanel.currentPanel !== undefined) {
          MainPanel.currentPanel._lastTimeout = setTimeout(() => {
            MainPanel.publishSchema(event.document);
          }, DIAGRAM_UPDATER_DEBOUNCE_TIME);
        }
      }
    });

    MainPanel.currentPanel?._disposables.push(disposable);
  }

  public static render({
    context,
    extensionConfigSession,
    webviewConfig,
    parser,
    fileExt,
  }: ExtensionRenderProps): void {
    MainPanel.parseCode = parser;
    MainPanel.fileExt = fileExt;

    const editor = window.activeTextEditor;
    if (editor == null) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      window.showErrorMessage("No active text editor found.");
      return;
    }

    const activeTextEditorColumn =
      window.activeTextEditor?.viewColumn ?? ViewColumn.One;

    const previewColumn = activeTextEditorColumn + 1;

    if (MainPanel.currentPanel != null) {
      // ALWAYS dispose the old panel to force reload of persisted data from .DBML/
      console.log("[MainPanel] Disposing existing panel to reload persisted data");
      MainPanel.currentPanel.dispose();
      MainPanel.currentPanel = undefined;
    }

    // Always create a fresh panel to ensure persisted data is loaded
    const panel = window.createWebviewPanel(
      webviewConfig.name,
      webviewConfig.title,
      previewColumn,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        enableCommandUris: true,
        // Allow modals (prompt, confirm, alert) in webview
        enableForms: true,
      },
    );

    panel.iconPath = {
      dark: Uri.joinPath(
        context.extensionUri,
        "assets",
        "icons",
        "preview-dark.svg",
      ),
      light: Uri.joinPath(
        context.extensionUri,
        "assets",
        "icons",
        "preview.svg",
      ),
    };

    MainPanel.currentPanel = new MainPanel(
      panel,
      context,
      extensionConfigSession,
    );
    MainPanel.registerDiagramUpdaterOnfFileChange();

    MainPanel.publishSchema(editor.document);
  }

  static getCurrentEditor(): TextEditor | undefined {
    const editor = window.activeTextEditor;
    if (editor == null) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      window.showErrorMessage("No active text editor found.");
      return;
    }

    return editor;
  }

  static publishSchema = (document: TextDocument): void => {
    const code = document.getText();
    try {
      const schema = MainPanel.parseCode(code);

      // remember last document used to allow refresh without an active editor
      MainPanel.lastDocument = document;

      // Debug log so extension host shows when we publish schema
      console.log("MainPanel.publishSchema: publishing schema for", document.uri.toString());

      // Post the schema to the webview if present
      // Use MainPanel.currentPanel explicitly to avoid issues with `this` binding
      if (MainPanel.currentPanel?._panel) {
        MainPanel.currentPanel._panel.webview.postMessage({
          type: "setSchema",
          payload: schema,
          key: document.uri.toString(),
        });
      } else {
        console.warn("MainPanel.publishSchema: no currentPanel available to post schema");
      }

      MainPanel.diagnosticCollection.clear();
    } catch (error) {
      console.error(JSON.stringify(error));
      if (error instanceof DiagnosticError) {
        MainPanel.diagnosticCollection.set(document.uri, [
          new Diagnostic(
            new Range(
              new Position(
                error.location.start.line,
                error.location.start.column,
              ),
              new Position(error.location.end.line, error.location.end.column),
            ),
            error.message,
            DiagnosticSeverity.Error,
          ),
        ]);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        window.showErrorMessage(`${error as any}`);
      }
    }
  };

  static refreshCurrentSchema = (): void => {
    const editor = MainPanel.getCurrentEditor();
    if (editor != null) {
      MainPanel.publishSchema(editor.document);
      return;
    }

    // fallback to last published document if any
    if (MainPanel.lastDocument != null) {
      MainPanel.publishSchema(MainPanel.lastDocument);
      return;
    }

    // no editor and no cached document
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    window.showErrorMessage(
      "No active text editor found and no cached document to refresh.",
    );
  };

  /**
   * Reload persisted data from .DBML/ and send to webview
   */
  static async reloadPersistedData(): Promise<void> {
    if (MainPanel.currentPanel?._panel == null) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      window.showErrorMessage("No diagram preview is open. Please open a Prisma diagram first.");
      return;
    }

    const persistedData: Record<string, unknown> = {};
    try {
      const wsFolder = workspace.workspaceFolders?.[0]?.uri;
      if (wsFolder !== undefined) {
        const dbmlDir = Uri.joinPath(wsFolder, ".DBML");
        try {
          const entries = await workspace.fs.readDirectory(dbmlDir);
          console.log("[MainPanel.reloadPersistedData] Found .DBML directory with entries:", entries.length);
          for (const [name] of entries) {
            if (name.endsWith('.json')) {
              try {
                const fileUri = Uri.joinPath(dbmlDir, name);
                const data = await workspace.fs.readFile(fileUri);
                const text = new TextDecoder().decode(data);
                const key = name.replace(/\.json$/, '').replace(/__/g, ':');
                persistedData[key] = JSON.parse(text);
                console.log("[MainPanel.reloadPersistedData] Loaded file:", name, "key:", key);
              } catch (e) {
                console.error('[MainPanel.reloadPersistedData] Failed to read file', name, e);
              }
            }
          }
        } catch (err) {
          console.log("[MainPanel.reloadPersistedData] No .DBML directory found:", err);
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          window.showInformationMessage("No .DBML directory found. Move some tables first to create saved positions.");
          return;
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        window.showErrorMessage("No workspace folder found.");
        return;
      }
    } catch (e) {
      console.error('[MainPanel.reloadPersistedData] Failed to collect persisted data', e);
      throw e; // Re-throw para que el comando handler lo capture
    }

    console.log("[MainPanel.reloadPersistedData] Sending", Object.keys(persistedData).length, "keys to webview");

    // Send to webview
    await MainPanel.currentPanel._panel.webview.postMessage({
      command: "RELOAD_PERSISTED_DATA",
      persistedData,
    });

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    window.showInformationMessage(`Reloaded ${Object.keys(persistedData).length} persisted data entries from .DBML/`);
  }

  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  public dispose(): void {
    MainPanel.currentPanel = undefined;

    // Dispose of the current webview panel
    this._panel.dispose();

    // Dispose of all disposables (i.e. commands) for the current webview panel
    while (this._disposables.length > 0) {
      const disposable = this._disposables.pop();
      if (disposable != null) {
        disposable.dispose();
      }
    }
  }
}
