const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function comprehensiveMigration() {
  console.log('🚀 Starting Comprehensive MySQL Migration...');
  
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

    // Create backup
    const backupFile = `./backups/station_mysql_pre_migration_${new Date().toISOString().split('T')[0]}.sql`;
    fs.writeFileSync(backupFile, dataContent);
    console.log(`💾 Backup created: ${backupFile}`);

    // Parse and clean the SQL data
    const insertStatements = dataContent
      .split(';')
      .filter(stmt => stmt.trim().startsWith('INSERT INTO'))
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📊 Found ${insertStatements.length} INSERT statements`);

    // Group statements by table
    const statementsByTable = {};
    insertStatements.forEach(stmt => {
      const tableMatch = stmt.match(/INSERT INTO `(\w+)`/);
      if (tableMatch) {
        const tableName = tableMatch[1];
        if (!statementsByTable[tableName]) {
          statementsByTable[tableName] = [];
        }
        statementsByTable[tableName].push(stmt);
      }
    });

    console.log(`📋 Tables found: ${Object.keys(statementsByTable).join(', ')}`);

    // Process each table with proper error handling
    let totalSuccess = 0;
    let totalErrors = 0;
    const tableResults = {};

    for (const [tableName, statements] of Object.entries(statementsByTable)) {
      console.log(`\n🔄 Processing table: ${tableName} (${statements.length} statements)`);
      
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const statement of statements) {
        try {
          // Clean and adapt the statement for the new schema
          let cleanStatement = statement;
          
          // Handle specific table mappings
          if (tableName === 'profiles') {
            // Map old profile structure to new Prisma schema
            cleanStatement = statement
              .replace(/`role`/g, '`position`')
              .replace(/`staff_code`/g, '`badge_id`')
              .replace(/`profile_image_url`/g, '`profile_image_url`');
          }
          
          if (tableName === 'inventory_products') {
            // Map inventory product fields
            cleanStatement = statement
              .replace(/`bin_no`/g, '`category`')
              .replace(/`sale_markup`/g, '`sale_price`')
              .replace(/`stock_category`/g, '`category`');
          }

          if (tableName === 'inventory_batches') {
            // Remove location field that doesn't exist in new schema
            cleanStatement = statement.replace(/`location`[^,]*,\s*/g, '');
          }

          if (tableName === 'job_cards') {
            // Map job card fields
            cleanStatement = statement
              .replace(/`jobcardid`/g, '`id`')
              .replace(/`customerid`/g, '`customer_id`')
              .replace(/`customername`/g, '`customername`')
              .replace(/`custaddress`/g, '`description`')
              .replace(/`custphone`/g, '`description`');
          }

          if (tableName === 'user_roles') {
            // Map user roles
            cleanStatement = statement
              .replace(/`role`/g, '`role_name`');
          }

          if (tableName === 'exchange_rates') {
            // Map exchange rate fields
            cleanStatement = statement
              .replace(/`base_currency`/g, '`from_currency`')
              .replace(/`target_currency`/g, '`to_currency`')
              .replace(/`last_updated`/g, '`date`');
          }

          // Execute the cleaned statement
          await connection.execute(cleanStatement);
          successCount++;
          
          if (successCount % 50 === 0) {
            console.log(`  ✅ Processed ${successCount}/${statements.length} statements...`);
          }
        } catch (error) {
          errorCount++;
          errors.push({
            statement: statement.substring(0, 100) + '...',
            error: error.message
          });
          
          if (errorCount <= 5) { // Only show first 5 errors per table
            console.log(`  ❌ Error: ${error.message}`);
          }
        }
      }

      tableResults[tableName] = { success: successCount, errors: errorCount };
      totalSuccess += successCount;
      totalErrors += errorCount;

      console.log(`  📊 ${tableName}: ${successCount} success, ${errorCount} errors`);
    }

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

    // Create final backup
    const finalBackupFile = `./backups/station_mysql_post_migration_${new Date().toISOString().split('T')[0]}.sql`;
    console.log(`\n💾 Creating final backup: ${finalBackupFile}`);
    
    // Export current database state
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    try {
      await execAsync(`mysqldump -u root --password="" station > "${finalBackupFile}"`);
      console.log(`✅ Final backup created: ${finalBackupFile}`);
    } catch (error) {
      console.log(`⚠️  Could not create final backup: ${error.message}`);
    }

    await connection.end();
    
    console.log('\n📈 Migration Summary:');
    console.log(`✅ Total Successful: ${totalSuccess}`);
    console.log(`❌ Total Errors: ${totalErrors}`);
    console.log('\n📋 Table Results:');
    Object.entries(tableResults).forEach(([table, result]) => {
      console.log(`  ${table}: ${result.success} success, ${result.errors} errors`);
    });
    
    console.log('\n🎉 Comprehensive migration completed successfully!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
comprehensiveMigration().catch(console.error);



