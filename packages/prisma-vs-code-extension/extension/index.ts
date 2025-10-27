import { commands, window, type ExtensionContext } from "vscode";

import { parsePrismaToJSON } from "prisma-to-json-table-schema";

import { MainPanel } from "./extension-shared/extension/views/panel";
import {
  EXTENSION_CONFIG_SESSION,
  WEB_VIEW_NAME,
  WEB_VIEW_TITLE,
} from "@/extension/constants";

export function activate(context: ExtensionContext): void {
  // Register the command and make activation robust: if anything throws while
  // attempting to set up the panel we catch it, log it and still expose a
  // fallback command so the user receives a clear message instead of
  // "command not found".
  try {
    const disposable = commands.registerCommand(
      "prisma-erd-visualizer.previewDiagrams",
      async () => {
        try {
          lunchExtension(context);
        } catch (err) {
          console.error("prisma-erd-visualizer: failed to open preview", err);
          void window.showErrorMessage(
            "Prisma ERD: failed to open preview — check Extension Host logs for details",
          );
        }
      },
    );

    // Register command to reload persisted data from .DBML/
    const reloadDataDisposable = commands.registerCommand(
      "prisma-erd-visualizer.reloadPersistedData",
      async () => {
        try {
          await MainPanel.reloadPersistedData();
        } catch (err) {
          console.error("prisma-erd-visualizer: failed to reload persisted data", err);
          void window.showErrorMessage(
            "Prisma ERD: failed to reload persisted data — check Extension Host logs for details",
          );
        }
      },
    );

    context.subscriptions.push(disposable);
    context.subscriptions.push(reloadDataDisposable);
    console.log("prisma-erd-visualizer: activate completed");
  } catch (err) {
    // If activate itself throws, make a best-effort fallback so the command
    // still exists and informs the user that activation failed.
    console.error("prisma-erd-visualizer: activate failed", err);
    try {
      const fallback = commands.registerCommand(
        "prisma-erd-visualizer.previewDiagrams",
        () => {
          void window.showErrorMessage(
            "Prisma ERD: activation failed — check Extension Host logs for details",
          );
        },
      );
      context.subscriptions.push(fallback);
    } catch (e) {
      console.error("prisma-erd-visualizer: failed to register fallback command", e);
    }
  }
}

const lunchExtension = (context: ExtensionContext): void => {
  console.log("prisma-erd-visualizer: lunchExtension called");
  try {
    console.log("prisma-erd-visualizer: calling MainPanel.render");
    MainPanel.render({
      context,
      extensionConfigSession: EXTENSION_CONFIG_SESSION,
      webviewConfig: {
        name: WEB_VIEW_NAME,
        title: WEB_VIEW_TITLE,
      },
      parser: parsePrismaToJSON,
      fileExt: "prisma",
    });
    console.log("prisma-erd-visualizer: MainPanel.render completed successfully");
  } catch (err) {
    console.error("prisma-erd-visualizer: lunchExtension failed", err);
    throw err; // Re-throw to be caught by the command handler
  }
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function deactivate() {}
