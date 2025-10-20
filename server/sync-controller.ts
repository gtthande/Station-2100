import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import express from "express";
import { config } from "dotenv";

// Load environment variables
config({ path: '.env.local' });

const router = express.Router();
const prisma = new PrismaClient();

// Guards
const REQ_DIR = (process.env.SYNC_DIRECTION || "mysql_to_supabase").toLowerCase();
const ALLOW_DESTRUCTIVE = String(process.env.ALLOW_DESTRUCTIVE || "false") === "true";
const MIRROR_DELETES = String(process.env.MIRROR_DELETES || "false") === "true";

// Environment validation
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;

if (!SUPABASE_URL) {
  console.error("Missing SUPABASE_URL or VITE_SUPABASE_URL environment variable");
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
  process.exit(1);
}

if (!SUPABASE_DB_URL) {
  console.error("Missing SUPABASE_DB_URL environment variable");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Raw PG for schema DDL where needed
const pg = new Pool({ connectionString: SUPABASE_DB_URL });

type SyncLog = {
  run_type: "schema" | "data" | "full",
  dry_run: boolean,
  tables: string[],
  added: number,
  updated: number,
  deleted: number,
  errors: string[]
};

async function logSync(entry: SyncLog) {
  try {
    await prisma.sync_logs.create({
      data: {
        run_type: entry.run_type,
        dry_run: entry.dry_run,
        tables: entry.tables,
        added: entry.added,
        updated: entry.updated,
        deleted: entry.deleted,
        errors: entry.errors.join("\n"),
      }
    });
  } catch (e) {
    console.error("Failed to log sync:", e);
  }
}

// ---- SCHEMA SYNC ----
router.post("/schema", async (req, res) => {
  if (REQ_DIR !== "mysql_to_supabase") return res.status(400).json({ error: "Invalid sync direction" });

  const dryRun = Boolean(req.query.dryRun === "true" || req.body?.dryRun);
  const from = process.env.DATABASE_URL!;
  const to = process.env.SUPABASE_DB_URL!;
  let added = 0, updated = 0;
  const errors: string[] = [];
  const start = Date.now();

  try {
    // Generate Postgres SQL diff script (additive)
    const script = execSync(
      `npx prisma migrate diff --from-url="${from}" --to-url="${to}" --script`,
      { encoding: "utf-8" }
    );

    // Safety: block destructive statements unless ALLOW_DESTRUCTIVE=true
    const lower = script.toLowerCase();
    const hasDestructive =
      lower.includes("drop table") || lower.includes("drop column") ||
      lower.includes("alter table") && lower.includes("drop");

    if (hasDestructive && !ALLOW_DESTRUCTIVE) {
      return res.status(409).json({
        error: "Destructive changes detected. Set ALLOW_DESTRUCTIVE=true to allow; currently blocked.",
        preview: script
      });
    }

    if (dryRun) {
      await logSync({ run_type: "schema", dry_run: true, tables: [], added, updated, deleted: 0, errors: [] });
      return res.json({ ok: true, dryRun: true, preview: script });
    }

    // Apply SQL on Supabase
    if (script.trim().length > 0) {
      await pg.query("BEGIN");
      await pg.query(script);  // Single script with multiple statements
      await pg.query("COMMIT");
      // Not precise counts, but we can heuristically increment:
      added = (script.match(/create table/gi) || []).length;
      updated = (script.match(/alter table/gi) || []).length;
    }

    await logSync({ run_type: "schema", dry_run: false, tables: [], added, updated, deleted: 0, errors });
    res.json({ ok: true, added, updated });
  } catch (err: any) {
    console.error(err);
    errors.push(err.message || String(err));
    await logSync({ run_type: "schema", dry_run: dryRun, tables: [], added, updated, deleted: 0, errors });
    res.status(500).json({ error: "Schema sync failed", details: err.message });
  }
});

// ---- DATA SYNC ----
async function upsertTable(table: string, pk = "id", batchSize = Number(process.env.SYNC_BATCH_SIZE || 1000)) {
  let added = 0, updated = 0;
  let offset = 0;

  // naive count to bound loops (optional)
  const [{ _count }] = await prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) AS _count FROM \`${table}\``);
  const total = Number(_count || 0);

  while (offset < total) {
    const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM \`${table}\` LIMIT ${batchSize} OFFSET ${offset}`);
    if (!rows.length) break;

    const { data, error } = await supabase.from(table).upsert(rows, { onConflict: pk });
    if (error) throw error;

    // Heuristic: assume all rows were upserted; hard split unknown without diff:
    added += rows.length;
    offset += batchSize;
  }
  return { added, updated };
}

router.post("/data", async (req, res) => {
  if (REQ_DIR !== "mysql_to_supabase") return res.status(400).json({ error: "Invalid sync direction" });

  const dryRun = Boolean(req.query.dryRun === "true" || req.body?.dryRun);
  const allowlist: string[] = JSON.parse(process.env.SYNC_TABLES || "[]");
  const errors: string[] = [];
  let added = 0, updated = 0, deleted = 0;
  const start = Date.now();

  try {
    if (dryRun) {
      // simple counts preview
      const counts: Record<string, number> = {};
      for (const t of allowlist) {
        const [{ _count }] = await prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) AS _count FROM \`${t}\``);
        counts[t] = Number(_count || 0);
      }
      await logSync({ run_type: "data", dry_run: true, tables: allowlist, added: 0, updated: 0, deleted: 0, errors: [] });
      return res.json({ ok: true, dryRun: true, counts, deletes: MIRROR_DELETES });
    }

    for (const t of allowlist) {
      const r = await upsertTable(t);
      added += r.added;
      updated += r.updated;
    }

    if (MIRROR_DELETES) {
      // (Optional later) implement delete reconciliation per table using key set comparisons.
      // For now, the default is NO deletes for safety.
    }

    await logSync({ run_type: "data", dry_run: false, tables: allowlist, added, updated, deleted, errors });
    res.json({ ok: true, tables: allowlist, added, updated, deleted });
  } catch (err: any) {
    console.error(err);
    errors.push(err.message || String(err));
    await logSync({ run_type: "data", dry_run: dryRun, tables: JSON.parse(process.env.SYNC_TABLES || "[]"), added, updated, deleted, errors });
    res.status(500).json({ error: "Data sync failed", details: err.message });
  }
});

// ---- FULL SYNC ----
router.post("/full", async (req, res) => {
  const dryRun = Boolean(req.query.dryRun === "true" || req.body?.dryRun);
  try {
    // 1) schema
    if (dryRun) {
      const s = await fetch("http://localhost:8787/api/sync/schema?dryRun=true", { method: "POST" }).then(r => r.json());
      const d = await fetch("http://localhost:8787/api/sync/data?dryRun=true", { method: "POST" }).then(r => r.json());
      return res.json({ ok: true, dryRun: true, schema: s, data: d });
    } else {
      await fetch("http://localhost:8787/api/sync/schema", { method: "POST" });
      const r = await fetch("http://localhost:8787/api/sync/data", { method: "POST" }).then(r => r.json());
      return res.json({ ok: true, ...r });
    }
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

router.get("/status", async (_req, res) => {
  try {
    const rows = await prisma.sync_logs.findMany({ take: 20, orderBy: { created_at: "desc" } });
    res.json({ ok: true, logs: rows });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
