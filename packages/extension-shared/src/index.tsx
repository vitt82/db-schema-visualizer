import * as React from "react";
import { createRoot } from "react-dom/client";
import "@tomjs/vscode-extension-webview/client";
import { tableCoordsStore } from "json-table-schema-visualizer/src/stores/tableCoords";

import App from "./App";

export const createExtensionApp = () => {
  // Initialize vsCodeWebviewAPI if not already set
  if (window.vsCodeWebviewAPI === undefined) {
    try {
      // @ts-expect-error acquireVsCodeApi is injected by VS Code webview runtime
      if (typeof acquireVsCodeApi === "function") {
        // @ts-expect-error acquireVsCodeApi is injected by VS Code webview runtime
        window.vsCodeWebviewAPI = acquireVsCodeApi();
        console.log("vsCodeWebviewAPI initialized successfully");
      } else {
        console.warn("acquireVsCodeApi not available, running in non-webview context");
      }
    } catch (err) {
      console.error("Failed to initialize vsCodeWebviewAPI", err);
    }
  }

  // Listen for RELOAD_PERSISTED_DATA command from host
  window.addEventListener("message", (event) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const message = event.data;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unnecessary-type-assertion
    if (message != null && typeof message === "object" && (message as any).command === "RELOAD_PERSISTED_DATA") {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unnecessary-type-assertion
      const persistedData = (message as any).persistedData;
      if (persistedData != null && typeof persistedData === "object") {
        console.log("[Webview] Received RELOAD_PERSISTED_DATA command with", Object.keys(persistedData as Record<string, unknown>).length, "keys");
        // Update window.EXTENSION_PERSISTED_DATA with fresh data from host
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).EXTENSION_PERSISTED_DATA = persistedData;
        console.log("[Webview] Updated EXTENSION_PERSISTED_DATA");
        // Force a reload by triggering a page refresh (webview will re-read the updated data)
        window.location.reload();
      }
    }
  });

  // save current table position when exiting the page
  window.addEventListener("unload", () => {
    tableCoordsStore.saveCurrentStore();
  });

  const View = () => {
    return <App />;
  };

  const appWrapper = document.getElementById("app");

  if (appWrapper !== null) {
    const root = createRoot(appWrapper);

    // sanity checks: ensure React hooks are available
    try {
      if ((React as any) == null || typeof (React as any).useState !== "function") {
        throw new Error("React not available or hooks not initialized");
      }

      try {
        root.render(<View />);
      } catch (err) {
      // Try to notify the extension host about the render error
      try {
        const win = window as unknown as Record<string, unknown>;
        const maybeApi = (win as any).vsCodeWebviewAPI ?? (typeof (win as any).acquireVsCodeApi === "function" ? (win as any).acquireVsCodeApi() : undefined);
        if (maybeApi != null && typeof maybeApi.postMessage === "function") {
          maybeApi.postMessage({
            command: "WEBVIEW_ERROR",
            message: JSON.stringify({ error: String(err), stack: (err as Error)?.stack ?? null }),
          });
        }
      } catch (e) {
        // ignore
      }

      // rethrow so it surfaces in dev setups
      throw err;
    }
    } catch (err) {
      // If React is not available or a pre-render sanity check failed, notify the host and stop.
      try {
        const win = window as unknown as Record<string, unknown>;
        const maybeApi = (win as any).vsCodeWebviewAPI ?? (typeof (win as any).acquireVsCodeApi === "function" ? (win as any).acquireVsCodeApi() : undefined);
        if (maybeApi != null && typeof maybeApi.postMessage === "function") {
          maybeApi.postMessage({
            command: "WEBVIEW_ERROR",
            message: JSON.stringify({ error: String(err), stack: (err as Error)?.stack ?? null }),
          });
        }
      } catch (e) {
        // ignore
      }
      // don't rethrow to avoid unhandled exception that breaks extension host logging
    }
  }
};
