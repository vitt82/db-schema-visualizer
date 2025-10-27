import { Layers3Icon } from "lucide-react";
import { WebviewCommand } from "extension-shared/extension/types/webviewCommand";

import ToolbarButton from "../Button";

const CustomArrangeButton = () => {
  const handleApplyPersisted = () => {
    // Request the host to reload persisted data from .DBML and push them to the webview
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
      // eslint-disable-next-line no-console
      console.debug(
        "CustomArrangeButton: posting RELOAD_PERSISTED_DATA_REQUEST to extension",
      );
      vsCodeAPI.postMessage({
        command: WebviewCommand.RELOAD_PERSISTED_DATA_REQUEST,
        message: "apply",
      });
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        "CustomArrangeButton: vsCodeWebviewAPI not available, cannot post message",
      );
    }
  };

  return (
    <ToolbarButton onClick={handleApplyPersisted} title="Custom Arrange (apply saved positions)">
      <Layers3Icon />
    </ToolbarButton>
  );
};

export default CustomArrangeButton;
