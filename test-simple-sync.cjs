const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');

// Load environment variables
config({ path: '.env.local' });

async function testSimpleSync() {
  console.log('🧪 Testing Simple Supabase Sync...\n');
  
  try {
    // Test Prisma connection
    console.log('1️⃣ Testing Prisma connection...');
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ Prisma connected');
    
    // Test Supabase connection
    console.log('\n2️⃣ Testing Supabase connection...');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Test users table
    console.log('\n3️⃣ Testing Supabase users table...');
    const usersResp = await supabase.from("users").select("*").limit(1);
    if (usersResp.error) {
      console.log(`❌ Users fetch failed: ${usersResp.error.message}`);
    } else {
      console.log(`✅ Users table accessible: ${usersResp.data?.length || 0} records`);
    }
    
    // Test profiles table
    console.log('\n4️⃣ Testing Supabase profiles table...');
    const profilesResp = await supabase.from("profiles").select("*").limit(1);
    if (profilesResp.error) {
      console.log(`❌ Profiles fetch failed: ${profilesResp.error.message}`);
    } else {
      console.log(`✅ Profiles table accessible: ${profilesResp.data?.length || 0} records`);
    }
    
    await prisma.$disconnect();
    console.log('\n✅ Simple sync test completed successfully!');
    
  } catch (error) {
    console.error('❌ Simple sync test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSimpleSync();
