import express from "express";
import cors from "cors";
import { exec } from "child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = process.env.SYNC_PORT ? Number(process.env.SYNC_PORT) : 8787;
const ALLOW = process.env.ALLOW_SYNC === "1";

const app = express();
app.use(express.json());
app.use(cors());

function run(cmd: string, cwd: string) {
  return new Promise<{ ok: boolean; out: string }>((resolve) => {
    exec(cmd, { cwd, windowsHide: true }, (error, stdout, stderr) => {
      const out = (stdout?.toString() ?? "") + (stderr ? `\n${stderr}` : "");
      resolve({ ok: !error, out });
    });
  });
}

function repoRoot() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return path.resolve(__dirname, ".."); // server/.. => project root
}

function guard(res: express.Response) {
  if (!ALLOW) {
    res.status(403).json({ ok: false, error: "Sync disabled. Set ALLOW_SYNC=1 in .env.local and restart the sync server." });
    return false;
  }
  return true;
}

app.get("/sync/status", async (_req, res) => {
  if (!guard(res)) return;
  const cwd = repoRoot();
  const branch = (await run(`git rev-parse --abbrev-ref HEAD`, cwd)).out.trim();
  const lr = await run(`git rev-list --left-right --count origin/${branch}...${branch}`, cwd);
  let ahead = 0, behind = 0;
  if (lr.ok) {
    const [b, a] = lr.out.trim().split(/\s+/);
    behind = Number(b || 0); ahead = Number(a || 0);
  }
  const lastCommit = (await run(`git log -1 --pretty="%h %ci %s"`, cwd)).out.trim();
  res.json({ ok: true, branch, ahead, behind, lastCommit });
});

app.post("/sync/down", async (_req, res) => {
  if (!guard(res)) return;
  const cwd = repoRoot();
  const remote = process.env.GIT_REMOTE || "origin";
  const branch = process.env.GIT_BRANCH || "main";
  const r = await run(`git pull ${remote} ${branch}`, cwd);
  res.status(r.ok ? 200 : 500).json({ ok: r.ok, log: r.out });
});

app.post("/sync/up", async (req, res) => {
  if (!guard(res)) return;
  const cwd = repoRoot();
  const msg = (req.body?.message as string)?.trim() || "Sync from Station-2100 UI";
  const remote = process.env.GIT_REMOTE || "origin";
  const branch = process.env.GIT_BRANCH || "main";
  const add = await run(`git add -A`, cwd);
  const commit = await run(`git commit -m "${msg.replace(/"/g, '\\"')}"`, cwd);
  const push = await run(`git push ${remote} ${branch}`, cwd);
  const ok = add.ok && push.ok; 
  res.status(ok ? 200 : 500).json({ ok, log: [add.out, commit.out, push.out].join("\n") });
});

app.post("/sync/db-push", async (_req, res) => {
  if (!guard(res)) return;
  const pwd = process.env.SUPABASE_DB_PASSWORD || "";
  const cwd = repoRoot();
  const r = await run(`npx supabase@latest db push --yes --password "${pwd}"`, cwd);
  res.status(r.ok ? 200 : 500).json({ ok: r.ok, log: r.out });
});

app.listen(PORT, () => {
  console.log(`[sync] server on http://localhost:${PORT} (ALLOW_SYNC=${ALLOW ? "1" : "0"})`);
});


