import vscode from "@tomjs/vite-plugin-vscode";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths(), react(), vscode({})],
  resolve: {
    alias: {
      // Force single React instance to fix hooks errors
      // All React imports will resolve to the same copy from workspace root
      react: path.resolve(__dirname, "../../node_modules/react"),
      "react-dom": path.resolve(__dirname, "../../node_modules/react-dom"),
      "react-dom/client": path.resolve(__dirname, "../../node_modules/react-dom/client"),
    },
  },
});
