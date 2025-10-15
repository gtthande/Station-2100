const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function migrateData() {
  console.log('🚀 Starting MySQL data migration...');
  
  try {
    // Connect to MySQL
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'station'
    });

    console.log('✅ Connected to MySQL database');

    // Read the existing data file
    const dataFile = path.join(__dirname, '../mysql/data/station2100_mysql_data.sql');
    const dataContent = fs.readFileSync(dataFile, 'utf8');
    
    console.log('📄 Loaded data file');

    // Split into individual INSERT statements
    const insertStatements = dataContent
      .split(';')
      .filter(stmt => stmt.trim().startsWith('INSERT INTO'))
      .map(stmt => stmt.trim());

    console.log(`📊 Found ${insertStatements.length} INSERT statements`);

    // Process each INSERT statement
    let successCount = 0;
    let errorCount = 0;

    for (const statement of insertStatements) {
      try {
        // Skip foreign key checks temporarily
        if (statement.includes('SET FOREIGN_KEY_CHECKS')) {
          await connection.execute(statement);
          continue;
        }

        // Execute the INSERT statement
        await connection.execute(statement);
        successCount++;
        
        if (successCount % 100 === 0) {
          console.log(`✅ Processed ${successCount} statements...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error executing statement: ${error.message}`);
        console.error(`Statement: ${statement.substring(0, 100)}...`);
      }
    }

    console.log(`\n📈 Migration Summary:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    // Verify data counts
    console.log('\n🔍 Verifying data counts...');
    
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
    console.log('\n🎉 Data migration completed successfully!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateData().catch(console.error);
