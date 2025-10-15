const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function stepByStepMigration() {
  console.log('🚀 Starting Step-by-Step MySQL Migration...');
  
  try {
    // Connect to MySQL
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'station'
    });

    console.log('✅ Connected to MySQL database');

    // Step 1: Create base user and profile data
    console.log('\n📝 Step 1: Creating base user data...');
    
    const baseUserId = 'd541f75c-eb0c-47c4-a1be-9b4b5a448ecd';
    const baseUserEmail = 'gtthande@gmail.com';
    
    // Insert base user
    await connection.execute(`
      INSERT IGNORE INTO users (id, email, created_at, updated_at, is_super_admin) 
      VALUES (?, ?, NOW(), NOW(), ?)
    `, [baseUserId, baseUserEmail, false]);
    
    // Insert base profile
    await connection.execute(`
      INSERT IGNORE INTO profiles (id, user_id, email, full_name, position, created_at, updated_at, is_staff, staff_active) 
      VALUES (?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)
    `, [baseUserId, baseUserId, baseUserEmail, 'Test User', 'user', false, true]);
    
    console.log('✅ Base user and profile created');

    // Step 2: Migrate inventory products with proper field mapping
    console.log('\n📦 Step 2: Migrating inventory products...');
    
    const dataFile = path.join(__dirname, '../mysql/data/station2100_mysql_data.sql');
    const dataContent = fs.readFileSync(dataFile, 'utf8');
    
    const inventoryStatements = dataContent
      .split(';')
      .filter(stmt => stmt.trim().startsWith('INSERT INTO `inventory_products`'))
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📊 Found ${inventoryStatements.length} inventory product statements`);

    let inventorySuccess = 0;
    let inventoryErrors = 0;

    for (const statement of inventoryStatements) {
      try {
        // Clean the statement to match our Prisma schema
        let cleanStatement = statement
          .replace(/`open_balance`[^,]*,\s*/g, '') // Remove open_balance
          .replace(/`open_bal_date`[^,]*,\s*/g, '') // Remove open_bal_date
          .replace(/`bin_no`/g, '`category`') // Map bin_no to category
          .replace(/`sale_markup`/g, '`sale_price`') // Map sale_markup to sale_price
          .replace(/`stock_category`/g, '`category`'); // Map stock_category to category

        await connection.execute(cleanStatement);
        inventorySuccess++;
        
        if (inventorySuccess % 100 === 0) {
          console.log(`  ✅ Processed ${inventorySuccess}/${inventoryStatements.length} products...`);
        }
      } catch (error) {
        inventoryErrors++;
        if (inventoryErrors <= 5) {
          console.log(`  ❌ Error: ${error.message}`);
        }
      }
    }

    console.log(`📊 Inventory Products: ${inventorySuccess} success, ${inventoryErrors} errors`);

    // Step 3: Migrate inventory batches
    console.log('\n📦 Step 3: Migrating inventory batches...');
    
    const batchStatements = dataContent
      .split(';')
      .filter(stmt => stmt.trim().startsWith('INSERT INTO `inventory_batches`'))
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📊 Found ${batchStatements.length} batch statements`);

    let batchSuccess = 0;
    let batchErrors = 0;

    for (const statement of batchStatements) {
      try {
        // Clean the statement to match our Prisma schema
        let cleanStatement = statement
          .replace(/`location`[^,]*,\s*/g, ''); // Remove location field

        await connection.execute(cleanStatement);
        batchSuccess++;
        
        if (batchSuccess % 100 === 0) {
          console.log(`  ✅ Processed ${batchSuccess}/${batchStatements.length} batches...`);
        }
      } catch (error) {
        batchErrors++;
        if (batchErrors <= 5) {
          console.log(`  ❌ Error: ${error.message}`);
        }
      }
    }

    console.log(`📊 Inventory Batches: ${batchSuccess} success, ${batchErrors} errors`);

    // Step 4: Migrate customers
    console.log('\n👥 Step 4: Migrating customers...');
    
    const customerStatements = dataContent
      .split(';')
      .filter(stmt => stmt.trim().startsWith('INSERT INTO `customers`'))
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📊 Found ${customerStatements.length} customer statements`);

    let customerSuccess = 0;
    let customerErrors = 0;

    for (const statement of customerStatements) {
      try {
        // Clean the statement to match our Prisma schema
        let cleanStatement = statement
          .replace(/`user_id`/g, `'${baseUserId}'`); // Use our base user ID

        await connection.execute(cleanStatement);
        customerSuccess++;
        
        if (customerSuccess % 50 === 0) {
          console.log(`  ✅ Processed ${customerSuccess}/${customerStatements.length} customers...`);
        }
      } catch (error) {
        customerErrors++;
        if (customerErrors <= 5) {
          console.log(`  ❌ Error: ${error.message}`);
        }
      }
    }

    console.log(`📊 Customers: ${customerSuccess} success, ${customerErrors} errors`);

    // Step 5: Migrate job cards
    console.log('\n📋 Step 5: Migrating job cards...');
    
    const jobCardStatements = dataContent
      .split(';')
      .filter(stmt => stmt.trim().startsWith('INSERT INTO `job_cards`'))
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📊 Found ${jobCardStatements.length} job card statements`);

    let jobCardSuccess = 0;
    let jobCardErrors = 0;

    for (const statement of jobCardStatements) {
      try {
        // Clean the statement to match our Prisma schema
        let cleanStatement = statement
          .replace(/`custfax`[^,]*,\s*/g, '') // Remove custfax field
          .replace(/`jobcardid`/g, '`id`') // Map jobcardid to id
          .replace(/`customerid`/g, '`customer_id`') // Map customerid to customer_id
          .replace(/`customername`/g, '`customername`') // Keep customername
          .replace(/`custaddress`/g, '`description`') // Map custaddress to description
          .replace(/`custphone`/g, '`description`'); // Map custphone to description

        await connection.execute(cleanStatement);
        jobCardSuccess++;
        
        if (jobCardSuccess % 10 === 0) {
          console.log(`  ✅ Processed ${jobCardSuccess}/${jobCardStatements.length} job cards...`);
        }
      } catch (error) {
        jobCardErrors++;
        if (jobCardErrors <= 5) {
          console.log(`  ❌ Error: ${error.message}`);
        }
      }
    }

    console.log(`📊 Job Cards: ${jobCardSuccess} success, ${jobCardErrors} errors`);

    // Step 6: Migrate user roles
    console.log('\n👤 Step 6: Migrating user roles...');
    
    const roleStatements = dataContent
      .split(';')
      .filter(stmt => stmt.trim().startsWith('INSERT INTO `user_roles`'))
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📊 Found ${roleStatements.length} role statements`);

    let roleSuccess = 0;
    let roleErrors = 0;

    for (const statement of roleStatements) {
      try {
        // Clean the statement to match our Prisma schema
        let cleanStatement = statement
          .replace(/`updated_at`[^,]*,\s*/g, '') // Remove updated_at field
          .replace(/`role`/g, '`role_name`'); // Map role to role_name

        await connection.execute(cleanStatement);
        roleSuccess++;
      } catch (error) {
        roleErrors++;
        if (roleErrors <= 5) {
          console.log(`  ❌ Error: ${error.message}`);
        }
      }
    }

    console.log(`📊 User Roles: ${roleSuccess} success, ${roleErrors} errors`);

    // Step 7: Migrate exchange rates
    console.log('\n💱 Step 7: Migrating exchange rates...');
    
    const exchangeStatements = dataContent
      .split(';')
      .filter(stmt => stmt.trim().startsWith('INSERT INTO `exchange_rates`'))
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📊 Found ${exchangeStatements.length} exchange rate statements`);

    let exchangeSuccess = 0;
    let exchangeErrors = 0;

    for (const statement of exchangeStatements) {
      try {
        // Clean the statement to match our Prisma schema
        let cleanStatement = statement
          .replace(/`manual_override`[^,]*,\s*/g, '') // Remove manual_override field
          .replace(/`base_currency`/g, '`from_currency`') // Map base_currency to from_currency
          .replace(/`target_currency`/g, '`to_currency`') // Map target_currency to to_currency
          .replace(/`last_updated`/g, '`date`'); // Map last_updated to date

        await connection.execute(cleanStatement);
        exchangeSuccess++;
      } catch (error) {
        exchangeErrors++;
        if (exchangeErrors <= 5) {
          console.log(`  ❌ Error: ${error.message}`);
        }
      }
    }

    console.log(`📊 Exchange Rates: ${exchangeSuccess} success, ${exchangeErrors} errors`);

    // Final verification
    console.log('\n🔍 Final Data Verification...');
    
    const tables = [
      'users', 'profiles', 'inventory_products', 'inventory_batches', 
      'customers', 'job_cards', 'user_roles', 'exchange_rates'
    ];

    for (const table of tables) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`📊 ${table}: ${rows[0].count} records`);
      } catch (error) {
        console.log(`⚠️  ${table}: Table not found or error - ${error.message}`);
      }
    }

    await connection.end();
    
    console.log('\n🎉 Step-by-step migration completed successfully!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
stepByStepMigration().catch(console.error);



