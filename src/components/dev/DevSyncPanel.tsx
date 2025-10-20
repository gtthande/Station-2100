import React, { useState } from "react";
// If you already implemented a real guard, leave it; otherwise comment out the next line.
// import { useAdminGuard } from "@/lib/auth/useAdminGuard";

type LogLine = { ts: string; text: string };
const add = (lines: LogLine[], text: string) => [...lines, { ts: new Date().toLocaleTimeString(), text }];

export default function DevSyncPanel() {
  // Optional guard:
  // useAdminGuard?.();

  const visible =
    typeof window !== "undefined" &&
    window.location.hostname === "localhost" &&
    import.meta.env.DEV;

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("Sync from Station-2100 UI");
  const [lines, setLines] = useState<LogLine[]>([]);
  const [dryRun, setDryRun] = useState(true);

  if (!visible) {
    return (
      <div className="p-6 rounded-xl border border-neutral-700">
        <div className="text-sm opacity-70">
          Dev Sync Panel is only available in <b>dev</b> on <b>localhost</b>.
        </div>
      </div>
    );
  }

  const syncBase =
    (typeof window !== "undefined" && (window as any).__SYNC_BASE__) ||
    (import.meta as any).env?.VITE_SYNC_BASE ||
    "http://localhost:8787";

  function mapToFallback(url: string) {
    if (url === "/sync/down") return "/__sync/pull";
    if (url === "/sync/up") return "/__sync/push";
    if (url === "/sync/db-push") return "/__sync/db";
    if (url === "/sync/status") return "/__sync/status";
    return url;
  }

  async function readJsonSafe(res: Response) {
    const text = await res.text();
    if (!text) return { ok: false, error: `Empty response`, status: res.status } as any;
    try {
      return JSON.parse(text);
    } catch (e: any) {
      return { ok: false, error: `Invalid JSON: ${e?.message || e}`, body: text, status: res.status } as any;
    }
  }

  async function call(url: string, body?: any) {
    setBusy(true);
    try {
      let res: Response | null = null;
      try {
        res = await fetch(`${syncBase}${url}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: body ? JSON.stringify(body) : undefined,
        });
      } catch {
        res = null;
      }
      if (!res || !res.ok) {
        try {
          res = await fetch(mapToFallback(url), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: body ? JSON.stringify(body) : undefined,
          });
        } catch {
          // leave res null
        }
      }
      if (!res) throw new Error("Failed to reach sync endpoint");
      const data = await readJsonSafe(res);
      setLines((l) => add(l, data.log || JSON.stringify(data)));
    } catch (e: any) {
      setLines((l) => add(l, "ERROR: " + (e?.message || String(e))));
    } finally {
      setBusy(false);
    }
  }

  async function syncCall(endpoint: string, dryRun: boolean = false) {
    setBusy(true);
    try {
      const url = `${syncBase}/api/sync/${endpoint}${dryRun ? "?dryRun=true" : ""}`;
      const res = await fetch(url, { method: "POST" });
      const data = await readJsonSafe(res);
      setLines((l) => add(l, `${endpoint} ${dryRun ? "(dry-run)" : "(live)"}: ${JSON.stringify(data)}`));
    } catch (e: any) {
      setLines((l) => add(l, "ERROR: " + (e?.message || String(e))));
    } finally {
      setBusy(false);
    }
  }

  async function status() {
    try {
      let res: Response | null = null;
      try {
        res = await fetch(`${syncBase}/sync/status`);
      } catch {}
      if (!res || !res.ok) {
        try { res = await fetch(mapToFallback("/sync/status")); } catch {}
      }
      const data = res ? await readJsonSafe(res) : ({ ok: false, error: "Failed to reach sync server" } as any);
      setLines((l) => add(l, "status: " + JSON.stringify(data)));
    } catch (e: any) {
      setLines((l) => add(l, "ERROR: " + (e?.message || String(e))));
    }
  }

  return (
    <div className="space-y-4">
      {/* One-Way Sync (MySQL → Supabase) */}
      <div className="rounded-2xl border border-neutral-700 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">One-Way Sync (MySQL → Supabase)</h2>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="rounded"
              />
              Dry Run
            </label>
            <button
              onClick={() => syncCall("status")}
              className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
            >
              View Logs
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <button
            disabled={busy}
            onClick={() => syncCall("schema", dryRun)}
            className="rounded-xl px-4 py-2 bg-blue-600/80 hover:bg-blue-600 disabled:opacity-50"
          >
            {dryRun ? "🔍" : "📋"} Schema Sync
          </button>

          <button
            disabled={busy}
            onClick={() => syncCall("data", dryRun)}
            className="rounded-xl px-4 py-2 bg-green-600/80 hover:bg-green-600 disabled:opacity-50"
          >
            {dryRun ? "🔍" : "📊"} Data Sync
          </button>

          <button
            disabled={busy}
            onClick={() => syncCall("full", dryRun)}
            className="rounded-xl px-4 py-2 bg-purple-600/80 hover:bg-purple-600 disabled:opacity-50"
          >
            {dryRun ? "🔍" : "🔄"} Full Sync
          </button>
        </div>

        <div className="mt-3 text-xs text-neutral-500">
          <strong>Safety:</strong> One-way sync only (MySQL → Supabase). Never writes back to MySQL.
          {dryRun && " <strong>Dry Run Mode:</strong> Preview changes without applying them."}
        </div>
      </div>

      {/* Legacy Code & DB Sync */}
      <div className="rounded-2xl border border-neutral-700 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Code & DB Sync</h2>
          <button
            onClick={status}
            className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
          >
            Refresh status
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <button
            disabled={busy}
            onClick={() => call("/sync/down")}
            className="rounded-xl px-4 py-2 bg-blue-600/80 hover:bg-blue-600 disabled:opacity-50"
          >
            ↓ Pull from GitHub
          </button>

          <div className="flex items-center gap-2">
            <button
              disabled={busy}
              onClick={() => call("/sync/up", { message: msg })}
              className="rounded-xl px-4 py-2 bg-emerald-600/80 hover:bg-emerald-600 disabled:opacity-50"
            >
              ↑ Push to GitHub
            </button>
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              className="flex-1 rounded-lg bg-neutral-900 border border-neutral-700 px-2 py-1"
              placeholder="Commit message"
            />
          </div>

          <button
            disabled={busy}
            onClick={() => call("/sync/db-push")}
            className="rounded-xl px-4 py-2 bg-purple-600/80 hover:bg-purple-600 disabled:opacity-50"
          >
            ⇄ Push DB Migrations
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-700">
        <div className="p-2 text-sm border-b border-neutral-800">Logs</div>
        <div className="h-56 overflow-auto p-2 text-sm bg-neutral-950">
          {lines.length === 0 ? (
            <div className="opacity-60">Logs will appear here…</div>
          ) : (
            lines
              .slice()
              .reverse()
              .map((l, i) => (
                <div key={i} className="whitespace-pre-wrap">
                  <span className="opacity-50 mr-2">{l.ts}</span>
                  {l.text}
                </div>
              ))
          )}
        </div>
        <div className="p-2 text-xs opacity-60">
          Requires sync server (auto-started by Vite in dev) and ALLOW_SYNC=1 in
          .env.local.
        </div>
      </div>
    </div>
  );
}





