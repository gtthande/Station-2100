#!/usr/bin/env tsx

/**
 * Cross-platform sync health check script
 * Checks if the Station-2100 sync endpoints are responding correctly
 */

import fetch from 'node-fetch';

const SYNC_PING_URL = 'http://localhost:8080/__sync/ping';
const SYNC_STATUS_URL = 'http://localhost:8080/__sync/status';

interface SyncResponse {
  ok: boolean;
  pong?: boolean;
  allow?: boolean;
  timestamp?: string;
}

async function checkSyncEndpoint(url: string, name: string): Promise<boolean> {
  try {
    console.log(`Checking ${name}...`);
    
    const response = await fetch(url, {
      method: 'GET',
      timeout: 5000, // 5 second timeout
    });

    if (!response.ok) {
      console.error(`❌ ${name} failed: HTTP ${response.status} ${response.statusText}`);
      return false;
    }

    const data: SyncResponse = await response.json() as SyncResponse;
    console.log(`✅ ${name}:`, JSON.stringify(data, null, 2));

    if (!data.ok) {
      console.error(`❌ ${name} returned ok: false`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`❌ ${name} error:`, error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function main() {
  console.log('🔍 Station-2100 Sync Health Check\n');

  const pingOk = await checkSyncEndpoint(SYNC_PING_URL, 'Ping');
  const statusOk = await checkSyncEndpoint(SYNC_STATUS_URL, 'Status');

  console.log('\n📊 Summary:');
  console.log(`Ping:   ${pingOk ? '✅ OK' : '❌ FAIL'}`);
  console.log(`Status: ${statusOk ? '✅ OK' : '❌ FAIL'}`);

  if (pingOk && statusOk) {
    console.log('\n🎉 All sync endpoints are healthy!');
    process.exit(0);
  } else {
    console.log('\n💥 Some sync endpoints are not responding correctly.');
    console.log('💡 Make sure the dev server is running: npm run dev');
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

