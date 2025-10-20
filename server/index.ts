import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import syncRoutes from "./sync-controller";

// Load environment variables
config({ path: '.env.local' });

const app = express();
const PORT = process.env.SYNC_PORT ? Number(process.env.SYNC_PORT) : 5055;
const ALLOW = process.env.ALLOW_SYNC === "1";

app.use(express.json());
app.use(cors());

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize Supabase with graceful fallback
let supabaseReady = false;
let supabase: any = null;

try {
  const { createClient } = require("@supabase/supabase-js");
  supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  supabaseReady = true;
  console.log("✅ Supabase client initialized");
} catch (err: any) {
  console.warn("⚠️ Supabase unavailable; continuing in MySQL-only mode:", err.message);
}

// Make supabase available globally for sync operations
(globalThis as any).supabase = supabase;
(globalThis as any).supabaseReady = supabaseReady;

// Basic health check
app.get("/api/ping", (_req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    supabase: supabaseReady ? "connected" : "unavailable"
  });
});

// MySQL health check
app.get("/api/admin/mysql/ping", async (req, res) => {
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
  }
});

// Supabase health check (non-blocking)
app.get("/api/admin/supabase/ping", async (req, res) => {
  if (!supabaseReady) {
    return res.json({ 
      ok: false, 
      error: "Supabase not available",
      details: "Continuing in MySQL-only mode"
    });
  }

  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    
    res.json({
      ok: true,
      details: {
        connection: 'active',
        mode: 'mirror'
      }
    });
  } catch (err: any) {
    res.status(500).json({ 
      ok: false, 
      error: err.message,
      details: "Supabase connection failed"
    });
  }
});

// Add sync routes (will handle Supabase unavailability gracefully)
app.use("/api/sync", syncRoutes);

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    details: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server on http://localhost:${PORT} (ALLOW_SYNC=${ALLOW ? "1" : "0"})`);
  console.log(`📊 MySQL ping: http://localhost:${PORT}/api/admin/mysql/ping`);
  console.log(`🔄 Supabase ping: http://localhost:${PORT}/api/admin/supabase/ping`);
  console.log(`🔄 Sync endpoints: http://localhost:${PORT}/api/sync/*`);
  console.log(`💡 Supabase status: ${supabaseReady ? "✅ Connected" : "⚠️ Unavailable (MySQL-only mode)"}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
