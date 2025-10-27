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

      const value = localStorage.getItem(key);
      console.log("[AppLocalStorage.getItem] Fallback to localStorage, got:", value !== null ? "data" : "null");
      if (value === null) return null;

      return JSON.parse(value);
    } catch (err) {
      // If anything goes wrong, fall back to null
      // eslint-disable-next-line no-console
      console.error("AppLocalStorage.getItem failed", err);
      return null;
    }
  }

  setItem(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));

      // If running inside a VS Code webview, ask the extension host to persist the file
      // We post a message with shape { command, message }
      // Use the same command strings the extension expects: FILE_WRITE
      
      // DEBUG: Log what we're trying to save
      console.log("[AppLocalStorage.setItem] Saving key:", key, "value length:", JSON.stringify(value).length);
      console.log("[AppLocalStorage.setItem] window.vsCodeWebviewAPI:", (window as any).vsCodeWebviewAPI);
      
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
