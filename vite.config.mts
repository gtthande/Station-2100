import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(async () => {
  const extraPlugins: any[] = [];
  try {
    const devSyncPlugin = (await import("./scripts/dev-sync-plugin.ts")).default;
    extraPlugins.push(devSyncPlugin());
  } catch {
    // optional plugin not present – ignore
  }

  return {
    plugins: [react(), ...extraPlugins],
    server: { port: 8080, strictPort: false },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
});
