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
  private readonly _readyPromise: Promise<void>;
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

    // Save state when the webview visibility changes (e.g., tab switched or hidden)
    this._panel.onDidChangeViewState(
      (event) => {
        if (!event.webviewPanel.visible) {
          console.log("[MainPanel] Webview hidden, requesting save from webview");
          void webview.postMessage({
            command: "SAVE_AND_CLOSE",
            message: "save all stores before hiding",
          });
        }
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

    const setupWebviewWithPersistedData = async (): Promise<void> => {
      const persistedData: Record<string, unknown> = {};
      try {
        const wsFolder = workspace.workspaceFolders?.[0]?.uri;
        if (wsFolder !== undefined) {
          const dbmlDir = Uri.joinPath(wsFolder, ".DBML");
          try {
            const entries = await workspace.fs.readDirectory(dbmlDir);
            console.log("[MainPanel] Found .DBML directory with entries:", entries.length);
            
            // Helper function to recursively read files
            const readFilesRecursively = async (dir: Uri, prefix: string = ""): Promise<void> => {
              try {
                const dirEntries = await workspace.fs.readDirectory(dir);
                for (const [name, type] of dirEntries) {
                  if (type === 1) {
                    // It's a file
                    if (name.endsWith('.json')) {
                      try {
                        const fileUri = Uri.joinPath(dir, name);
                        const data = await workspace.fs.readFile(fileUri);
                        const text = new TextDecoder().decode(data);
                        // Decode filename back to original key
                        const keyUnescaped = decodeURIComponent(name.replace(/\.json$/, ''));
                        persistedData[keyUnescaped] = JSON.parse(text);
                        console.log("[MainPanel] Loaded persisted data - file:", name, "key:", keyUnescaped, "entries:", Array.isArray(persistedData[keyUnescaped]) ? (persistedData[keyUnescaped] as unknown[]).length : "not array");
                      } catch (e) {
                        // ignore file parse errors
                        console.error('[MainPanel] Failed to read persisted file', name, e);
                      }
                    }
                  } else if (type === 2) {
                    // It's a directory - recurse
                    const subDir = Uri.joinPath(dir, name);
                    await readFilesRecursively(subDir, prefix + name + "/");
                  }
                }
              } catch (err) {
                console.warn("[MainPanel] Error reading directory:", err);
              }
            };
            
            await readFilesRecursively(dbmlDir);
          } catch {
            // no .DBML folder yet
            console.log("[MainPanel] No .DBML directory found");
          }
        }
      } catch (e) {
        console.error('[MainPanel] Failed to collect persisted data for webview', e);
      }

      console.log("[MainPanel] Total persisted keys to inject:", Object.keys(persistedData).length, "keys:", Object.keys(persistedData));

      // If we have legacy groups saved under 'tableGroups:none' but there is a
      // file-specific key missing for the currently active document, attempt a
      // one-time migration: write a new .DBML file for the document-specific
      // key and add it to the persistedData object so the webview will see it.
      try {
        const activeDoc = window.activeTextEditor?.document;
        const wsFolderForMigration = workspace.workspaceFolders?.[0]?.uri;
        if (activeDoc != null && Object.prototype.hasOwnProperty.call(persistedData, "tableGroups:none") && wsFolderForMigration != null) {
          const docKey = `tableGroups:${activeDoc.uri.toString()}`;
          if (!Object.prototype.hasOwnProperty.call(persistedData, docKey)) {
            console.log("[MainPanel] Migrating legacy tableGroups:none to document key:", docKey);
            const legacy = persistedData["tableGroups:none"];
            // persist new file on disk using the same filename escaping logic
            const filename = encodeURIComponent(docKey) + ".json";
            const fileUri = Uri.joinPath(wsFolderForMigration, ".DBML", filename);
            try {
              const content = new TextEncoder().encode(JSON.stringify(legacy, null, 2));
              await workspace.fs.writeFile(fileUri, content);
              // inject migrated value into persistedData so webview receives it
              persistedData[docKey] = legacy;
              console.log("[MainPanel] Migration successful, wrote file:", filename);
            } catch (e) {
              console.error('[MainPanel] Migration: failed to write migrated file', e);
            }
          }
        }
      } catch (e) {
        console.error('[MainPanel] Migration check failed', e);
      }

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
    };

    this._readyPromise = setupWebviewWithPersistedData().catch((error) => {
      console.error("[MainPanel] Failed to setup webview with persisted data", error);
    });
  }

  public get ready(): Promise<void> {
    return this._readyPromise;
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
            void MainPanel.publishSchema(event.document);
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

  void MainPanel.publishSchema(editor.document);
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

  static publishSchema = async (document: TextDocument): Promise<void> => {
    const code = document.getText();
    try {
      const schema = MainPanel.parseCode(code);

      // remember last document used to allow refresh without an active editor
      MainPanel.lastDocument = document;

      // Debug log so extension host shows when we publish schema
      console.log("MainPanel.publishSchema: publishing schema for", document.uri.toString());

      const panel = MainPanel.currentPanel;
      if (panel == null) {
        console.warn("MainPanel.publishSchema: no currentPanel available to post schema");
        return;
      }

      await panel.ready;

      await panel._panel.webview.postMessage({
        type: "setSchema",
        payload: schema,
        key: document.uri.toString(),
      });

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
      void MainPanel.publishSchema(editor.document);
      return;
    }

    // fallback to last published document if any
    if (MainPanel.lastDocument != null) {
      void MainPanel.publishSchema(MainPanel.lastDocument);
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
          // Helper function to recursively read files
          const readFilesRecursively = async (dir: Uri): Promise<void> => {
            try {
              const dirEntries = await workspace.fs.readDirectory(dir);
              for (const [name, type] of dirEntries) {
                if (type === 1) {
                  // It's a file
                  if (name.endsWith('.json')) {
                    try {
                      const fileUri = Uri.joinPath(dir, name);
                      const data = await workspace.fs.readFile(fileUri);
                      const text = new TextDecoder().decode(data);
                      const key = decodeURIComponent(name.replace(/\.json$/, ''));
                      persistedData[key] = JSON.parse(text);
                      console.log("[MainPanel.reloadPersistedData] Loaded file:", name, "key:", key);
                    } catch (e) {
                      console.error('[MainPanel.reloadPersistedData] Failed to read file', name, e);
                    }
                  }
                } else if (type === 2) {
                  // It's a directory - recurse
                  const subDir = Uri.joinPath(dir, name);
                  await readFilesRecursively(subDir);
                }
              }
            } catch (err) {
              console.warn("[MainPanel.reloadPersistedData] Error reading directory:", err);
            }
          };

          await readFilesRecursively(dbmlDir);
          console.log("[MainPanel.reloadPersistedData] Found .DBML directory, read files recursively");
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
