import { PrismaClient } from '@prisma/client';

// Global variable to store the Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create a singleton Prisma client
export const prisma = globalThis.__prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// Store the client in global scope to prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Database health check
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', database: 'mysql' };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Graceful shutdown
export async function disconnectDatabase() {
  await prisma.$disconnect();
}



