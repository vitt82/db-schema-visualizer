import Storage from "@/types/storage";

// Hybrid storage used in the webview:
// - on load, read from window.EXTENSION_PERSISTED_DATA if present (host-injected)
// - fallback to localStorage
// - on set/remove, persist to localStorage and ask extension host to write/delete a file
export class AppLocalStorage<T> extends Storage<T> {
  getItem(key: string): object | null {
    try {
      // Prefer host-injected persisted data which is synchronous
      // window.EXTENSION_PERSISTED_DATA keys are expected to match the persistence key
      // used by PersistableStore (e.g. "storeName:documentUri").
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const injected = (window as any).EXTENSION_PERSISTED_DATA as Record<string, unknown> | undefined;
      
      // DEBUG: Log what we're looking for and what's available
      console.log("[AppLocalStorage.getItem] Looking for key:", key);
      console.log("[AppLocalStorage.getItem] Available keys in EXTENSION_PERSISTED_DATA:", 
        injected !== undefined && injected !== null ? Object.keys(injected) : "undefined");
      
      if (injected !== undefined && injected !== null && Object.prototype.hasOwnProperty.call(injected, key)) {
        console.log("[AppLocalStorage.getItem] Found in EXTENSION_PERSISTED_DATA:", injected[key]);
        return injected[key] as object;
      }

      // Compatibility fallback: if we are looking for a document-specific
      // tableGroups key (e.g. "tableGroups:file://...") but only a legacy
      // "tableGroups:none" entry exists, use that as a fallback so the UI
      // can restore existing groups until a proper migration runs.
      try {
        if (typeof key === "string" && key.startsWith("tableGroups:") && injected != null && Object.prototype.hasOwnProperty.call(injected, "tableGroups:none")) {
          console.log("[AppLocalStorage.getItem] Falling back to legacy tableGroups:none for key:", key);
          const legacy = injected["tableGroups:none"] as object;
          // populate the cache under the new key so subsequent reads hit the fast path
          injected[key] = legacy;
          return legacy;
        }
      } catch (e) {
        // ignore fallback errors and continue to localStorage fallback
        console.error("[AppLocalStorage.getItem] Legacy fallback failed", e);
      }

      const value = localStorage.getItem(key);
      console.log("[AppLocalStorage.getItem] Fallback to localStorage, got:", value !== null ? "data" : "null");
      if (value === null) return null;

      const parsed = JSON.parse(value);

      if (injected != null) {
        // keep injected cache in sync so future getItem hits the fast path
        injected[key] = parsed;
      }

      return parsed;
    } catch (err) {
      // If anything goes wrong, fall back to null
      // eslint-disable-next-line no-console
      console.error("AppLocalStorage.getItem failed", err);
      return null;
    }
  }

  setItem(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);

      // If running inside a VS Code webview, ask the extension host to persist the file
      // We post a message with shape { command, message }
      // Use the same command strings the extension expects: FILE_WRITE
      
      // DEBUG: Log what we're trying to save
      console.log("[AppLocalStorage.setItem] Saving key:", key, "value length:", serialized.length);
      console.log("[AppLocalStorage.setItem] window.vsCodeWebviewAPI:", (window as any).vsCodeWebviewAPI);
      
      // update injected cache immediately so subsequent getItem reads the fresh value
      const injected = (window as any).EXTENSION_PERSISTED_DATA as Record<string, unknown> | undefined;
      if (injected != null) {
        injected[key] = value as unknown;
      }

      const api = (window as any).vsCodeWebviewAPI;
      
      if (api !== undefined && api !== null && typeof api.postMessage === "function") {
        try {
          const payload = { command: "FILE_WRITE", message: JSON.stringify({ key, value }) };
          console.log("[AppLocalStorage.setItem] Posting message:", payload);
          api.postMessage(payload);
          console.log("[AppLocalStorage.setItem] FILE_WRITE message posted successfully");
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn("AppLocalStorage: failed to post FILE_WRITE", e);
        }
      } else {
        console.warn("[AppLocalStorage.setItem] vsCodeWebviewAPI not available or invalid:", {
          isUndefined: api === undefined,
          isNull: api === null,
          hasPostMessage: api !== null && api !== undefined && typeof api.postMessage,
        });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("AppLocalStorage.setItem failed", err);
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);

      const injected = (window as any).EXTENSION_PERSISTED_DATA as Record<string, unknown> | undefined;
      if (injected != null) {
        Reflect.deleteProperty(injected, key);
      }

      // request deletion from extension host if inside a webview
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const api = (window as unknown as Window & { vsCodeWebviewAPI?: { postMessage?: (m: unknown) => void } }).vsCodeWebviewAPI;
      if (api !== undefined && api !== null && typeof api.postMessage === "function") {
        try {
          api.postMessage({ command: "FILE_DELETE", message: JSON.stringify({ key }) });
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn("AppLocalStorage: failed to post FILE_DELETE", e);
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("AppLocalStorage.removeItem failed", err);
    }
  }
}
