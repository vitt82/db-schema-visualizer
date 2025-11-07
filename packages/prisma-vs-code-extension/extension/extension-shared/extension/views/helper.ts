/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
/* eslint-disable @typescript-eslint/no-extraneous-class */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import { type Disposable, type ExtensionContext, type Webview, workspace, Uri } from "vscode";
import { type Theme } from "json-table-schema-visualizer/src/types/theme";

import {
  WebviewCommand,
  type WebviewPostMessage,
} from "../types/webviewCommand";
import { type DefaultPageConfig } from "../types/defaultPageConfig";
import { type ExtensionConfig } from "../helper/extensionConfigs";
import { WEBVIEW_HTML_MARKER_FOR_DEFAULT_CONFIG } from "../constants";

export class WebviewHelper {
  public static setupHtml(
    webview: Webview,
    context: ExtensionContext,
    defaultConfig: DefaultPageConfig,
    persistedData?: Record<string, unknown>,
  ): string {
    const html: string = process.env.VITE_DEV_SERVER_URL
      ? /* @ts-ignore */
        __getWebviewHtml__(process.env.VITE_DEV_SERVER_URL)
      : /* @ts-ignore */
        __getWebviewHtml__(webview, context);

    return WebviewHelper.injectDefaultConfig(html, defaultConfig, persistedData);
  }

  public static injectDefaultConfig(
    html: string,
    configs: DefaultPageConfig,
    persistedData?: Record<string, unknown>,
  ): string {
    const persisted = persistedData ?? {};
    console.log("[WebviewHelper.injectDefaultConfig] Injecting persisted data keys:", Object.keys(persisted));
    console.log("[WebviewHelper.injectDefaultConfig] Persisted data content:", JSON.stringify(persisted).substring(0, 500));
    return html.replace(
      WEBVIEW_HTML_MARKER_FOR_DEFAULT_CONFIG,
      `
       window.EXTENSION_DEFAULT_CONFIG = ${JSON.stringify(configs)};
       window.EXTENSION_PERSISTED_DATA = ${JSON.stringify(persisted)};
      `,
    );
  }

  public static handleWebviewMessage(
    command: string,
    message: string,
    extensionConfig: ExtensionConfig,
    onRefreshSchema?: () => void,
  ): void {
    switch (command) {
      case WebviewCommand.SET_THEME_PREFERENCES:
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        extensionConfig.setTheme(message as Theme);
        break;
      case WebviewCommand.REFRESH_SCHEMA:
        // Trigger schema refresh
        onRefreshSchema?.();
        break;
      case WebviewCommand.SCHEMA_RECEIVED:
        try {
          const payload = JSON.parse(message);
          // Log a concise health report from the webview
          console.log("Webview SCHEMA_RECEIVED ack:", {
            key: payload.key,
            ok: payload.ok,
            tables: payload.tables,
            enums: payload.enums,
            sampleTables: payload.sampleTables,
          });
        } catch (err) {
          console.log("Webview acknowledged schema (raw):", message);
        }
        break;
      case WebviewCommand.WEBVIEW_ERROR:
        try {
          const payload = JSON.parse(message);
          console.error("Webview runtime error:", payload.error, payload.stack ?? "");
        } catch (err) {
          console.error("Webview runtime error (raw):", message);
        }
        break;
      case WebviewCommand.WEBVIEW_RENDERED:
        try {
          const payload = JSON.parse(message);
          console.log("Webview rendered:", { key: payload.key, tables: payload.tables, enums: payload.enums, sampleTables: payload.sampleTables });
        } catch (err) {
          console.log("Webview rendered (raw):", message);
        }
        break;
      default:
    }
  }

  public static setupWebviewHooks(
    webview: Webview,
    extConfig: ExtensionConfig,
    disposables: Disposable[],
    refreshCurrentSchema: () => void,
  ): void {
    console.log("[WebviewHelper] Setting up webview hooks - registering onDidReceiveMessage");
    webview.onDidReceiveMessage(
      async (message: WebviewPostMessage) => {
        const command = message.command;
        const textMessage = message.message;
        console.log("[WebviewHelper] onDidReceiveMessage triggered - command:", command, "payload length:", textMessage?.length ?? 0);

        // Handle file persistence commands directly here so we can use workspace.fs
        if (command === WebviewCommand.FILE_WRITE) {
          try {
            const payload = JSON.parse(textMessage);
            const key: string = payload.key;
            const value = payload.value;

            const wsFolder = workspace.workspaceFolders?.[0]?.uri;
            if (!wsFolder) { throw new Error("No workspace folder available"); }

            const dbmlDir = Uri.joinPath(wsFolder, ".DBML");
            // ensure directory
            try {
              await workspace.fs.stat(dbmlDir);
            } catch {
              await workspace.fs.createDirectory(dbmlDir);
            }

            const filename = key.replace(/:/g, "__") + ".json";
            const fileUri = Uri.joinPath(dbmlDir, filename);
            const content = new TextEncoder().encode(JSON.stringify(value, null, 2));
            await workspace.fs.writeFile(fileUri, content);

            // ack back to webview
            void webview.postMessage({
              command: WebviewCommand.FILE_RESPONSE,
              message: JSON.stringify({ key, ok: true }),
            });
          } catch (err) {
            console.error("Failed to write persisted file", err);
            void webview.postMessage({
              command: WebviewCommand.FILE_RESPONSE,
              message: JSON.stringify({ ok: false, error: String(err) }),
            });
          }

          return;
        }

        if (command === WebviewCommand.FILE_DELETE) {
          try {
            const payload = JSON.parse(textMessage);
            const key: string = payload.key;
            const wsFolder = workspace.workspaceFolders?.[0]?.uri;
            if (!wsFolder) { throw new Error("No workspace folder available"); }

            const dbmlDir = Uri.joinPath(wsFolder, ".DBML");
            const filename = key.replace(/:/g, "__") + ".json";
            const fileUri = Uri.joinPath(dbmlDir, filename);
            await workspace.fs.delete(fileUri);

            void webview.postMessage({
              command: WebviewCommand.FILE_RESPONSE,
              message: JSON.stringify({ key, ok: true }),
            });
          } catch (err) {
            console.error("Failed to delete persisted file", err);
            void webview.postMessage({
              command: WebviewCommand.FILE_RESPONSE,
              message: JSON.stringify({ ok: false, error: String(err) }),
            });
          }

          return;
        }

        // Fallback to existing behavior
        WebviewHelper.handleWebviewMessage(
          command,
          textMessage,
          extConfig,
          refreshCurrentSchema,
        );
      },
      undefined,
      disposables,
    );
  }
}
