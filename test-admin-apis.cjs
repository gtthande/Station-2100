const { PrismaClient } = require('@prisma/client');
const { config } = require('dotenv');

// Load environment variables
config({ path: '.env.local' });

async function testAdminAPIs() {
  console.log('🧪 Testing Station-2100 Admin APIs...\n');
  
  // Test 1: MySQL Connection via Prisma
  console.log('1️⃣ Testing MySQL Connection...');
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    
    const result = await prisma.$queryRaw`SELECT VERSION() AS version`;
    const version = result[0]?.version || 'Unknown';
    
    const tableCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = 'station'
    `;
    
    console.log(`✅ MySQL Connected: ${version}`);
    console.log(`✅ Database: station (${Number(tableCount[0]?.count || 0)} tables)`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.log(`❌ MySQL Connection Failed: ${error.message}`);
  }
  
  // Test 2: Environment Variables
  console.log('\n2️⃣ Testing Environment Variables...');
  const requiredEnvVars = [
    'DATABASE_URL',
    'VITE_SUPABASE_URL', 
    'VITE_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  let envOk = true;
  requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar}: Set`);
    } else {
      console.log(`❌ ${envVar}: Missing`);
      envOk = false;
    }
  });
  
  if (envOk) {
    console.log('✅ All required environment variables are set');
  } else {
    console.log('❌ Some environment variables are missing');
  }
  
  // Test 3: API Endpoints (if server is running)
  console.log('\n3️⃣ Testing API Endpoints...');
  try {
    const mysqlResponse = await fetch('http://localhost:8787/api/admin/mysql/ping');
    if (mysqlResponse.ok) {
      const mysqlData = await mysqlResponse.json();
      console.log(`✅ MySQL Ping API: ${mysqlData.ok ? 'Working' : 'Failed'}`);
      if (mysqlData.details) {
        console.log(`   Version: ${mysqlData.details.version}`);
        console.log(`   Tables: ${mysqlData.details.tables}`);
      }
    } else {
      console.log(`❌ MySQL Ping API: HTTP ${mysqlResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ MySQL Ping API: ${error.message} (Server may not be running)`);
  }
  
  try {
    const syncResponse = await fetch('http://localhost:8787/api/admin/supabase/sync?dryRun=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (syncResponse.ok) {
      const syncData = await syncResponse.json();
      console.log(`✅ Supabase Sync API: ${syncData.ok ? 'Working' : 'Failed'}`);
      if (syncData.dryRun) {
        console.log(`   Dry Run: ${syncData.dryRun}`);
        console.log(`   Users: ${syncData.users?.total || 0}`);
        console.log(`   Profiles: ${syncData.profiles?.total || 0}`);
      }
    } else {
      console.log(`❌ Supabase Sync API: HTTP ${syncResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Supabase Sync API: ${error.message} (Server may not be running)`);
  }
  
  console.log('\n🎉 Admin API Testing Complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Open http://localhost:8080/admin');
  console.log('3. Test the MySQL Connect and Supabase Sync buttons');
  console.log('4. Check browser console for any errors');
}

testAdminAPIs().catch(console.error);
