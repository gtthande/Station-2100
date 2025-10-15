var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// scripts/dev-sync-plugin.ts
var dev_sync_plugin_exports = {};
__export(dev_sync_plugin_exports, {
  default: () => devSyncPlugin
});
import path from "node:path";
import { existsSync } from "node:fs";
import { config as loadDotenv } from "file:///E:/Projects/Cusor/Station-2100/node_modules/dotenv/lib/main.js";
function loadEnvOnce() {
  const root = process.cwd();
  for (const name of [".env.local", ".env"]) {
    const p = path.join(root, name);
    if (existsSync(p)) loadDotenv({ path: p, override: false });
  }
}
function devSyncPlugin() {
  loadEnvOnce();
  return {
    name: "station-dev-sync",
    configureServer(server) {
      const ok = (res, data) => {
        res.statusCode = 200;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify(data));
      };
      const err = (res, message, status = 500) => {
        res.statusCode = status;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: message }));
      };
      const allow = () => process.env.ALLOW_SYNC === "1";
      server.middlewares.use(
        "/__sync/ping",
        (_req, res) => ok(res, { ok: true, pong: true })
      );
      server.middlewares.use(
        "/__sync/status",
        (_req, res) => ok(res, { ok: true, allow: allow() })
      );
      server.middlewares.use("/__sync/pull", async (_req, res) => {
        if (!allow()) return err(res, "Sync disabled (ALLOW_SYNC!=1)", 403);
        try {
          ok(res, { ok: true, action: "pull", ts: Date.now() });
        } catch (e) {
          err(res, e?.message ?? "pull failed");
        }
      });
      server.middlewares.use("/__sync/push", async (_req, res) => {
        if (!allow()) return err(res, "Sync disabled (ALLOW_SYNC!=1)", 403);
        try {
          ok(res, { ok: true, action: "push", ts: Date.now() });
        } catch (e) {
          err(res, e?.message ?? "push failed");
        }
      });
      server.middlewares.use("/__sync/db", async (_req, res) => {
        if (!allow()) return err(res, "Sync disabled (ALLOW_SYNC!=1)", 403);
        try {
          ok(res, { ok: true, action: "db", ts: Date.now() });
        } catch (e) {
          err(res, e?.message ?? "db failed");
        }
      });
    }
  };
}
var init_dev_sync_plugin = __esm({
  "scripts/dev-sync-plugin.ts"() {
  }
});

// vite.config.mts
import dotenv from "file:///E:/Projects/Cusor/Station-2100/node_modules/dotenv/lib/main.js";
import { defineConfig } from "file:///E:/Projects/Cusor/Station-2100/node_modules/vite/dist/node/index.js";
import react from "file:///E:/Projects/Cusor/Station-2100/node_modules/@vitejs/plugin-react/dist/index.js";
import path2 from "node:path";
var __vite_injected_original_dirname = "E:\\Projects\\Cusor\\Station-2100";
dotenv.config({ path: ".env.local" });
var vite_config_default = defineConfig(async () => {
  const extraPlugins = [];
  try {
    const devSyncPlugin2 = (await Promise.resolve().then(() => (init_dev_sync_plugin(), dev_sync_plugin_exports))).default;
    extraPlugins.push(devSyncPlugin2());
  } catch {
  }
  return {
    plugins: [react(), ...extraPlugins],
    server: { port: 8080, strictPort: false },
    resolve: {
      alias: {
        "@": path2.resolve(__vite_injected_original_dirname, "src")
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2NyaXB0cy9kZXYtc3luYy1wbHVnaW4udHMiLCAidml0ZS5jb25maWcubXRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRTpcXFxcUHJvamVjdHNcXFxcQ3Vzb3JcXFxcU3RhdGlvbi0yMTAwXFxcXHNjcmlwdHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXFByb2plY3RzXFxcXEN1c29yXFxcXFN0YXRpb24tMjEwMFxcXFxzY3JpcHRzXFxcXGRldi1zeW5jLXBsdWdpbi50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovUHJvamVjdHMvQ3Vzb3IvU3RhdGlvbi0yMTAwL3NjcmlwdHMvZGV2LXN5bmMtcGx1Z2luLnRzXCI7XHVGRUZGaW1wb3J0IHBhdGggZnJvbSBcIm5vZGU6cGF0aFwiO1xyXG5pbXBvcnQgeyBleGlzdHNTeW5jIH0gZnJvbSBcIm5vZGU6ZnNcIjtcclxuaW1wb3J0IHsgY29uZmlnIGFzIGxvYWREb3RlbnYgfSBmcm9tIFwiZG90ZW52XCI7XHJcblxyXG4vKiogTG9hZCAuZW52LmxvY2FsIGZpcnN0LCB0aGVuIC5lbnYgKGRvblx1MjAxOXQgb3ZlcnJpZGUgZXhpc3RpbmcgZW52IHZhcnMpLiAqL1xyXG5mdW5jdGlvbiBsb2FkRW52T25jZSgpIHtcclxuICBjb25zdCByb290ID0gcHJvY2Vzcy5jd2QoKTtcclxuICBmb3IgKGNvbnN0IG5hbWUgb2YgW1wiLmVudi5sb2NhbFwiLCBcIi5lbnZcIl0pIHtcclxuICAgIGNvbnN0IHAgPSBwYXRoLmpvaW4ocm9vdCwgbmFtZSk7XHJcbiAgICBpZiAoZXhpc3RzU3luYyhwKSkgbG9hZERvdGVudih7IHBhdGg6IHAsIG92ZXJyaWRlOiBmYWxzZSB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGRldlN5bmNQbHVnaW4oKSB7XHJcbiAgbG9hZEVudk9uY2UoKTtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIG5hbWU6IFwic3RhdGlvbi1kZXYtc3luY1wiLFxyXG4gICAgY29uZmlndXJlU2VydmVyKHNlcnZlcjogYW55KSB7XHJcbiAgICAgIGNvbnN0IG9rID0gKHJlczogYW55LCBkYXRhOiBhbnkpID0+IHtcclxuICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMDtcclxuICAgICAgICByZXMuc2V0SGVhZGVyKFwiY29udGVudC10eXBlXCIsIFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiKTtcclxuICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcclxuICAgICAgfTtcclxuICAgICAgY29uc3QgZXJyID0gKHJlczogYW55LCBtZXNzYWdlOiBzdHJpbmcsIHN0YXR1cyA9IDUwMCkgPT4ge1xyXG4gICAgICAgIHJlcy5zdGF0dXNDb2RlID0gc3RhdHVzO1xyXG4gICAgICAgIHJlcy5zZXRIZWFkZXIoXCJjb250ZW50LXR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIpO1xyXG4gICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBvazogZmFsc2UsIGVycm9yOiBtZXNzYWdlIH0pKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNvbnN0IGFsbG93ID0gKCkgPT4gcHJvY2Vzcy5lbnYuQUxMT1dfU1lOQyA9PT0gXCIxXCI7XHJcblxyXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKFwiL19fc3luYy9waW5nXCIsIChfcmVxOiBhbnksIHJlczogYW55KSA9PlxyXG4gICAgICAgIG9rKHJlcywgeyBvazogdHJ1ZSwgcG9uZzogdHJ1ZSB9KVxyXG4gICAgICApO1xyXG5cclxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShcIi9fX3N5bmMvc3RhdHVzXCIsIChfcmVxOiBhbnksIHJlczogYW55KSA9PlxyXG4gICAgICAgIG9rKHJlcywgeyBvazogdHJ1ZSwgYWxsb3c6IGFsbG93KCkgfSlcclxuICAgICAgKTtcclxuXHJcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoXCIvX19zeW5jL3B1bGxcIiwgYXN5bmMgKF9yZXE6IGFueSwgcmVzOiBhbnkpID0+IHtcclxuICAgICAgICBpZiAoIWFsbG93KCkpIHJldHVybiBlcnIocmVzLCBcIlN5bmMgZGlzYWJsZWQgKEFMTE9XX1NZTkMhPTEpXCIsIDQwMyk7XHJcbiAgICAgICAgdHJ5IHsgb2socmVzLCB7IG9rOiB0cnVlLCBhY3Rpb246IFwicHVsbFwiLCB0czogRGF0ZS5ub3coKSB9KTsgfVxyXG4gICAgICAgIGNhdGNoIChlOiBhbnkpIHsgZXJyKHJlcywgZT8ubWVzc2FnZSA/PyBcInB1bGwgZmFpbGVkXCIpOyB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShcIi9fX3N5bmMvcHVzaFwiLCBhc3luYyAoX3JlcTogYW55LCByZXM6IGFueSkgPT4ge1xyXG4gICAgICAgIGlmICghYWxsb3coKSkgcmV0dXJuIGVycihyZXMsIFwiU3luYyBkaXNhYmxlZCAoQUxMT1dfU1lOQyE9MSlcIiwgNDAzKTtcclxuICAgICAgICB0cnkgeyBvayhyZXMsIHsgb2s6IHRydWUsIGFjdGlvbjogXCJwdXNoXCIsIHRzOiBEYXRlLm5vdygpIH0pOyB9XHJcbiAgICAgICAgY2F0Y2ggKGU6IGFueSkgeyBlcnIocmVzLCBlPy5tZXNzYWdlID8/IFwicHVzaCBmYWlsZWRcIik7IH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKFwiL19fc3luYy9kYlwiLCBhc3luYyAoX3JlcTogYW55LCByZXM6IGFueSkgPT4ge1xyXG4gICAgICAgIGlmICghYWxsb3coKSkgcmV0dXJuIGVycihyZXMsIFwiU3luYyBkaXNhYmxlZCAoQUxMT1dfU1lOQyE9MSlcIiwgNDAzKTtcclxuICAgICAgICB0cnkgeyBvayhyZXMsIHsgb2s6IHRydWUsIGFjdGlvbjogXCJkYlwiLCB0czogRGF0ZS5ub3coKSB9KTsgfVxyXG4gICAgICAgIGNhdGNoIChlOiBhbnkpIHsgZXJyKHJlcywgZT8ubWVzc2FnZSA/PyBcImRiIGZhaWxlZFwiKTsgfVxyXG4gICAgICB9KTtcclxuICAgIH0sXHJcbiAgfTtcclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkU6XFxcXFByb2plY3RzXFxcXEN1c29yXFxcXFN0YXRpb24tMjEwMFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxcUHJvamVjdHNcXFxcQ3Vzb3JcXFxcU3RhdGlvbi0yMTAwXFxcXHZpdGUuY29uZmlnLm10c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovUHJvamVjdHMvQ3Vzb3IvU3RhdGlvbi0yMTAwL3ZpdGUuY29uZmlnLm10c1wiO1x1RkVGRmltcG9ydCBkb3RlbnYgZnJvbSBcImRvdGVudlwiO1xyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XHJcbmltcG9ydCBwYXRoIGZyb20gXCJub2RlOnBhdGhcIjtcclxuXHJcbi8vIExvYWQgLmVudi5sb2NhbCBhdCB0aGUgdmVyeSB0b3AgdG8gZW5zdXJlIEFMTE9XX1NZTkMgaXMgYXZhaWxhYmxlXHJcbmRvdGVudi5jb25maWcoeyBwYXRoOiBcIi5lbnYubG9jYWxcIiB9KTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyhhc3luYyAoKSA9PiB7XHJcbiAgY29uc3QgZXh0cmFQbHVnaW5zOiBhbnlbXSA9IFtdO1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBkZXZTeW5jUGx1Z2luID0gKGF3YWl0IGltcG9ydChcIi4vc2NyaXB0cy9kZXYtc3luYy1wbHVnaW4udHNcIikpLmRlZmF1bHQ7XHJcbiAgICBleHRyYVBsdWdpbnMucHVzaChkZXZTeW5jUGx1Z2luKCkpO1xyXG4gIH0gY2F0Y2gge1xyXG4gICAgLy8gb3B0aW9uYWwgcGx1Z2luIG5vdCBwcmVzZW50IFx1MjAxMyBpZ25vcmVcclxuICB9XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBwbHVnaW5zOiBbcmVhY3QoKSwgLi4uZXh0cmFQbHVnaW5zXSxcclxuICAgIHNlcnZlcjogeyBwb3J0OiA4MDgwLCBzdHJpY3RQb3J0OiBmYWxzZSB9LFxyXG4gICAgcmVzb2x2ZToge1xyXG4gICAgICBhbGlhczoge1xyXG4gICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcInNyY1wiKSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgfTtcclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBdVQsT0FBTyxVQUFVO0FBQ3hVLFNBQVMsa0JBQWtCO0FBQzNCLFNBQVMsVUFBVSxrQkFBa0I7QUFHckMsU0FBUyxjQUFjO0FBQ3JCLFFBQU0sT0FBTyxRQUFRLElBQUk7QUFDekIsYUFBVyxRQUFRLENBQUMsY0FBYyxNQUFNLEdBQUc7QUFDekMsVUFBTSxJQUFJLEtBQUssS0FBSyxNQUFNLElBQUk7QUFDOUIsUUFBSSxXQUFXLENBQUMsRUFBRyxZQUFXLEVBQUUsTUFBTSxHQUFHLFVBQVUsTUFBTSxDQUFDO0FBQUEsRUFDNUQ7QUFDRjtBQUVlLFNBQVIsZ0JBQWlDO0FBQ3RDLGNBQVk7QUFFWixTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixnQkFBZ0IsUUFBYTtBQUMzQixZQUFNLEtBQUssQ0FBQyxLQUFVLFNBQWM7QUFDbEMsWUFBSSxhQUFhO0FBQ2pCLFlBQUksVUFBVSxnQkFBZ0IsaUNBQWlDO0FBQy9ELFlBQUksSUFBSSxLQUFLLFVBQVUsSUFBSSxDQUFDO0FBQUEs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
