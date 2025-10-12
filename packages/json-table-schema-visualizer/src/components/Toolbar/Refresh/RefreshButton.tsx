import { RefreshCwIcon } from "lucide-react";
import { WebviewCommand } from "extension-shared/extension/types/webviewCommand";

import ToolbarButton from "../Button";

const RefreshButton = () => {
  const handleRefresh = () => {
    // Send refresh command to the extension
    // Try the global var first, then fallback to acquireVsCodeApi if available
    // and log the operation for debugging.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let vsCodeAPI: any = (window as any).vsCodeWebviewAPI;
    if (
      vsCodeAPI == null &&
      typeof (window as any).acquireVsCodeApi === "function"
    ) {
      try {
        vsCodeAPI = (window as any).acquireVsCodeApi();
        // expose for other modules
        (window as any).vsCodeWebviewAPI = vsCodeAPI;
      } catch (err) {
        // ignore
      }
    }

    if (vsCodeAPI != null) {
      // debug
      // eslint-disable-next-line no-console
      console.debug(
        "RefreshButton: posting REFRESH_SCHEMA message to extension",
      );
      vsCodeAPI.postMessage({
        command: WebviewCommand.REFRESH_SCHEMA,
        message: "refresh",
      });
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        "RefreshButton: vsCodeWebviewAPI not available, cannot post message",
      );
    }
  };

  return (
    <ToolbarButton onClick={handleRefresh} title="Refresh">
      <RefreshCwIcon />
    </ToolbarButton>
  );
};

export default RefreshButton;
