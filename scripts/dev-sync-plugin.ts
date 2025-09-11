import path from "node:path";
import { existsSync } from "node:fs";
import { config as loadDotenv } from "dotenv";

/** Load .env.local first, then .env (don’t override existing env vars). */
function loadEnvOnce() {
  const root = process.cwd();
  for (const name of [".env.local", ".env"]) {
    const p = path.join(root, name);
    if (existsSync(p)) loadDotenv({ path: p, override: false });
  }
}

export default function devSyncPlugin() {
  loadEnvOnce();

  return {
    name: "station-dev-sync",
    configureServer(server: any) {
      const ok = (res: any, data: any) => {
        res.statusCode = 200;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify(data));
      };
      const err = (res: any, message: string, status = 500) => {
        res.statusCode = status;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: message }));
      };

      const allow = () => process.env.ALLOW_SYNC === "1";

      server.middlewares.use("/__sync/ping", (_req: any, res: any) =>
        ok(res, { ok: true, pong: true })
      );

      server.middlewares.use("/__sync/status", (_req: any, res: any) =>
        ok(res, { ok: true, allow: allow() })
      );

      server.middlewares.use("/__sync/pull", async (_req: any, res: any) => {
        if (!allow()) return err(res, "Sync disabled (ALLOW_SYNC!=1)", 403);
        try { ok(res, { ok: true, action: "pull", ts: Date.now() }); }
        catch (e: any) { err(res, e?.message ?? "pull failed"); }
      });

      server.middlewares.use("/__sync/push", async (_req: any, res: any) => {
        if (!allow()) return err(res, "Sync disabled (ALLOW_SYNC!=1)", 403);
        try { ok(res, { ok: true, action: "push", ts: Date.now() }); }
        catch (e: any) { err(res, e?.message ?? "push failed"); }
      });

      server.middlewares.use("/__sync/db", async (_req: any, res: any) => {
        if (!allow()) return err(res, "Sync disabled (ALLOW_SYNC!=1)", 403);
        try { ok(res, { ok: true, action: "db", ts: Date.now() }); }
        catch (e: any) { err(res, e?.message ?? "db failed"); }
      });
    },
  };
}
