import React, { useState } from "react";

type LogLine = { ts: string; text: string };
const add = (lines: LogLine[], text: string) => [...lines, { ts: new Date().toLocaleTimeString(), text }];

export default function CodeSyncPanel() {
  const visible = typeof window !== "undefined" && window.location.hostname === "localhost" && import.meta.env.DEV;
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("Sync from Station-2100 UI");
  const [lines, setLines] = useState<LogLine[]>([]);

  if (!visible) return null;

  const syncBase = (typeof window !== "undefined" && (window as any).__SYNC_BASE__) ||
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
    try { return JSON.parse(text); } catch (e: any) {
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
      // If the external server is not reachable or not ok, retry via Vite middleware
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

  async function status() {
    try {
      let res: Response | null = null;
      try {
        res = await fetch(`${syncBase}/sync/status`);
      } catch {}
      if (!res || !res.ok) {
        try { res = await fetch(mapToFallback("/sync/status")); } catch {}
      }
      const data = res ? await readJsonSafe(res) : { ok: false, error: "Failed to reach sync server" } as any;
      setLines((l) => add(l, "status: " + JSON.stringify(data)));
    } catch (e: any) {
      setLines((l) => add(l, "ERROR: " + (e?.message || String(e))));
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Code & DB Sync (dev-only)</h3>
        <button onClick={status} className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700">Refresh status</button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <button disabled={busy} onClick={() => call("/sync/down")} className="rounded-xl px-4 py-2 bg-blue-600/80 hover:bg-blue-600 disabled:opacity-50">↓ Pull from GitHub</button>

        <div className="flex items-center gap-2">
          <button disabled={busy} onClick={() => call("/sync/up", { message: msg })} className="rounded-xl px-4 py-2 bg-emerald-600/80 hover:bg-emerald-600 disabled:opacity-50">↑ Push to GitHub</button>
          <input value={msg} onChange={(e) => setMsg(e.target.value)} className="flex-1 rounded-lg bg-neutral-900 border border-neutral-700 px-2 py-1" placeholder="Commit message" />
        </div>

        <button disabled={busy} onClick={() => call("/sync/db-push")} className="rounded-xl px-4 py-2 bg-purple-600/80 hover:bg-purple-600 disabled:opacity-50">⇄ Push DB Migrations</button>
      </div>

      <div className="h-56 overflow-auto rounded-xl bg-neutral-950 border border-neutral-800 p-2 text-sm">
        {lines.length === 0 ? <div className="opacity-60">Logs will appear here…</div> :
          lines.slice().reverse().map((l, i) => (
            <div key={i} className="whitespace-pre-wrap">
              <span className="opacity-50 mr-2">{l.ts}</span>{l.text}
            </div>
          ))}
      </div>

      <div className="text-xs opacity-60">Runs only in dev on localhost. Requires <code>ALLOW_SYNC=1</code>.</div>
    </div>
  );
}


