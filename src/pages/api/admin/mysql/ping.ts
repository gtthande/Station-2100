import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    // Test MySQL connection and get version
    const result = await prisma.$queryRaw<Array<{ version: string }>>`SELECT VERSION() AS version`;
    const version = result[0]?.version || 'Unknown';
    
    // Test basic query to ensure tables are accessible
    const tableCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = 'station'
    `;
    
    const tableCountNum = Number(tableCount[0]?.count || 0);
    
    res.json({ 
      ok: true, 
      details: {
        version,
        database: 'station',
        tables: tableCountNum,
        connection: 'active'
      }
    });
  } catch (err: any) {
    console.error('MySQL ping error:', err);
    res.status(500).json({ 
      ok: false, 
      error: err.message,
      details: {
        connection: 'failed',
        database: 'station'
      }
    });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
