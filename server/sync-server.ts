import express from "express";
import cors from "cors";
import { exec } from "child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: '.env.local' });

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

// Admin API endpoints
app.get("/api/admin/mysql/ping", async (req, res) => {
  const prisma = new PrismaClient();
  try {
    const result = await prisma.$queryRaw<Array<{ version: string }>>`SELECT VERSION() AS version`;
    const version = result[0]?.version || 'Unknown';
    
    const tableCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = 'station'
    `;
    
    res.json({ 
      ok: true, 
      details: {
        version,
        database: 'station',
        tables: Number(tableCount[0]?.count || 0),
        connection: 'active'
      }
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
});

app.post("/api/admin/supabase/sync", async (req, res) => {
  const prisma = new PrismaClient();
  const dryRun = req.query.dryRun === "true";
  
  try {
    // Debug environment variables
    console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'Set' : 'Missing');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
    
    if (!process.env.VITE_SUPABASE_URL) {
      throw new Error('VITE_SUPABASE_URL is required');
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
    }
    
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Sync Users (from auth.users)
    const usersResp = await supabase.auth.admin.listUsers();
    if (usersResp.error) throw new Error(`Users fetch failed: ${usersResp.error.message}`);
    const users = usersResp.data?.users || [];

    let usersInserted = 0, usersUpdated = 0;

    if (!dryRun) {
      await prisma.$transaction(async (tx) => {
        for (const u of users) {
          const existing = await tx.user.findUnique({ where: { id: u.id } });
          if (!existing) {
            await tx.user.create({ 
              data: {
                id: u.id,
                email: u.email || '',
                created_at: u.created_at ? new Date(u.created_at) : new Date(),
                updated_at: new Date(),
                email_confirmed_at: u.email_confirmed_at ? new Date(u.email_confirmed_at) : null,
                last_sign_in_at: u.last_sign_in_at ? new Date(u.last_sign_in_at) : null,
                raw_app_meta_data: u.app_metadata,
                raw_user_meta_data: u.user_metadata,
                is_super_admin: u.app_metadata?.role === 'super_admin' || false,
                phone: u.phone,
                phone_confirmed_at: u.phone_confirmed_at ? new Date(u.phone_confirmed_at) : null,
                confirmed_at: u.confirmed_at ? new Date(u.confirmed_at) : null,
                is_anonymous: u.is_anonymous || false,
              }
            });
            usersInserted++;
          } else {
            await tx.user.update({ 
              where: { id: u.id }, 
              data: {
                email: u.email || existing.email,
                updated_at: new Date(),
                email_confirmed_at: u.email_confirmed_at ? new Date(u.email_confirmed_at) : existing.email_confirmed_at,
                last_sign_in_at: u.last_sign_in_at ? new Date(u.last_sign_in_at) : existing.last_sign_in_at,
                raw_app_meta_data: u.app_metadata || existing.raw_app_meta_data,
                raw_user_meta_data: u.user_metadata || existing.raw_user_meta_data,
                is_super_admin: u.app_metadata?.role === 'super_admin' || existing.is_super_admin,
                phone: u.phone || existing.phone,
                phone_confirmed_at: u.phone_confirmed_at ? new Date(u.phone_confirmed_at) : existing.phone_confirmed_at,
                confirmed_at: u.confirmed_at ? new Date(u.confirmed_at) : existing.confirmed_at,
                is_anonymous: u.is_anonymous !== undefined ? u.is_anonymous : existing.is_anonymous,
              }
            });
            usersUpdated++;
          }
        }
      });
    }

    // Sync Profiles
    const profilesResp = await supabase.from("profiles").select("*");
    if (profilesResp.error) throw new Error(`Profiles fetch failed: ${profilesResp.error.message}`);
    const profiles = profilesResp.data || [];

    let profilesInserted = 0, profilesUpdated = 0;

    if (!dryRun) {
      await prisma.$transaction(async (tx) => {
        for (const p of profiles) {
          const existing = await tx.profile.findUnique({ where: { id: p.id } });
          if (!existing) {
            await tx.profile.create({ 
              data: {
                id: p.id,
                user_id: p.user_id || '',
                email: p.email || '',
                full_name: p.full_name,
                created_at: p.created_at ? new Date(p.created_at) : new Date(),
                updated_at: new Date(),
              }
            });
            profilesInserted++;
          } else {
            await tx.profile.update({ 
              where: { id: p.id }, 
              data: {
                user_id: p.user_id || existing.user_id,
                email: p.email || existing.email,
                full_name: p.full_name || existing.full_name,
                updated_at: new Date(),
              }
            });
            profilesUpdated++;
          }
        }
      });
    }

    res.json({
      ok: true,
      dryRun,
      timestamp: new Date().toISOString(),
      users: { 
        total: users.length, 
        inserted: usersInserted, 
        updated: usersUpdated 
      },
      profiles: { 
        total: profiles.length, 
        inserted: profilesInserted, 
        updated: profilesUpdated 
      },
    });

  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
});

app.listen(PORT, () => {
  console.log(`[sync] server on http://localhost:${PORT} (ALLOW_SYNC=${ALLOW ? "1" : "0"})`);
  console.log(`[admin] MySQL ping: http://localhost:${PORT}/api/admin/mysql/ping`);
  console.log(`[admin] Supabase sync: http://localhost:${PORT}/api/admin/supabase/sync`);
});


