#!/usr/bin/env node

const mysql = require('mysql2/promise');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Environment variables
const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DB || 'station2100_mysql_shadow'
};

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jarlvtojzqkccovburmi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Migration statistics
const migrationStats = {
  totalTables: 0,
  successfulTables: 0,
  failedTables: 0,
  totalRows: 0,
  successfulRows: 0,
  failedRows: 0,
  retryCount: 0,
  startTime: new Date(),
  endTime: null,
  errors: []
};

// Logging function
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type}] ${message}`;
  console.log(logMessage);
  
  // Write to log file
  const logFile = path.join(__dirname, 'logs/migration.log');
  fs.appendFileSync(logFile, logMessage + '\n');
}

// Error logging function
function logError(error, context = '') {
  const errorMessage = `ERROR: ${context} - ${error.message}`;
  log(errorMessage, 'ERROR');
  
  migrationStats.errors.push({
    context,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  
  // Write to error log file
  const errorLogFile = path.join(__dirname, 'logs/migration-errors.log');
  fs.appendFileSync(errorLogFile, `${new Date().toISOString()} - ${context}: ${error.message}\n${error.stack}\n\n`);
}

// Retry function with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      migrationStats.retryCount++;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      log(`Attempt ${attempt} failed, retrying in ${delay}ms: ${error.message}`, 'WARN');
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Get all data from a Supabase table with pagination
async function getAllDataFromTable(tableName, batchSize = 500) {
  try {
    log(`Fetching data from table: ${tableName}`);
    
    let allData = [];
    let from = 0;
    let hasMore = true;
    
    while (hasMore) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .range(from, from + batchSize - 1);
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      if (data && data.length > 0) {
        allData = allData.concat(data);
        from += batchSize;
        hasMore = data.length === batchSize;
        
        log(`  Fetched ${data.length} rows (total: ${allData.length})`);
      } else {
        hasMore = false;
      }
    }
    
    log(`Retrieved ${allData.length} total rows from ${tableName}`);
    return allData;
  } catch (error) {
    logError(error, `getAllDataFromTable(${tableName})`);
    return [];
  }
}

// Create MySQL table from data structure
async function createMySQLTableFromData(tableName, data, connection) {
  if (data.length === 0) {
    log(`No data to create table structure for: ${tableName}`);
    return false;
  }
  
  try {
    log(`Creating MySQL table: ${tableName}`);
    
    const firstRow = data[0];
    const columns = Object.keys(firstRow);
    
    let createTableSQL = `CREATE TABLE IF NOT EXISTS \`${tableName}\` (\n`;
    
    const columnDefinitions = columns.map(col => {
      const value = firstRow[col];
      let mysqlType = 'TEXT';
      let nullable = 'NULL';
      
      // Infer MySQL type from data
      if (value === null) {
        mysqlType = 'TEXT';
      } else if (typeof value === 'boolean') {
        mysqlType = 'BOOLEAN';
      } else if (typeof value === 'number') {
        if (Number.isInteger(value)) {
          mysqlType = 'INT';
        } else {
          mysqlType = 'DECIMAL(10,2)';
        }
      } else if (typeof value === 'string') {
        if (value.length <= 255) {
          mysqlType = `VARCHAR(255)`;
        } else {
          mysqlType = 'TEXT';
        }
      } else if (value instanceof Date) {
        mysqlType = 'DATETIME';
      } else if (typeof value === 'object') {
        mysqlType = 'JSON';
      }
      
      // Handle primary key
      if (col === 'id') {
        mysqlType = 'VARCHAR(36)';
        nullable = 'NOT NULL';
      }
      
      return `  \`${col}\` ${mysqlType} ${nullable}`;
    });
    
    createTableSQL += columnDefinitions.join(',\n');
    createTableSQL += '\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
    
    await connection.execute(createTableSQL);
    log(`✅ Table ${tableName} created successfully`);
    return true;
  } catch (error) {
    logError(error, `createMySQLTableFromData(${tableName})`);
    return false;
  }
}

// Insert data into MySQL table with batch processing
async function insertMySQLData(tableName, data, connection) {
  if (data.length === 0) {
    log(`No data to insert for table: ${tableName}`);
    return { success: 0, failed: 0 };
  }
  
  try {
    log(`Inserting ${data.length} rows into ${tableName}`);
    
    const columns = Object.keys(data[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO \`${tableName}\` (\`${columns.join('`, `')}\`) VALUES (${placeholders})`;
    
    let successCount = 0;
    let failedCount = 0;
    
    // Process in batches of 100
    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      for (const row of batch) {
        try {
          const values = columns.map(col => {
            const value = row[col];
            // Handle special data types
            if (value === null) return null;
            if (typeof value === 'object' && value !== null) {
              return JSON.stringify(value);
            }
            return value;
          });
          
          await connection.execute(sql, values);
          successCount++;
        } catch (error) {
          failedCount++;
          logError(error, `insertMySQLData(${tableName}, row ${i})`);
        }
      }
      
      if (i % 500 === 0) {
        log(`  Processed ${i + batch.length} rows...`);
      }
    }
    
    log(`✅ Successfully inserted ${successCount} rows into ${tableName} (${failedCount} failed)`);
    return { success: successCount, failed: failedCount };
  } catch (error) {
    logError(error, `insertMySQLData(${tableName})`);
    return { success: 0, failed: data.length };
  }
}

// Get row count from Supabase table
async function getSupabaseRowCount(tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      logError(error, `getSupabaseRowCount(${tableName})`);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    logError(error, `getSupabaseRowCount(${tableName})`);
    return 0;
  }
}

// Get row count from MySQL table
async function getMySQLRowCount(tableName, connection) {
  try {
    const [result] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
    return result[0].count;
  } catch (error) {
    logError(error, `getMySQLRowCount(${tableName})`);
    return 0;
  }
}

// Main migration function
async function migrateToMySQL() {
  log('🚀 Starting Supabase to MySQL migration...');
  migrationStats.startTime = new Date();
  
  try {
    // Connect to MySQL
    const connection = await mysql.createConnection(MYSQL_CONFIG);
    log('✅ Connected to MySQL database');
    
    // List of tables to migrate (based on Station-2100 schema)
    const tablesToMigrate = [
      'profiles',
      'user_roles',
      'custom_roles',
      'customers',
      'customer_permissions',
      'inventory_products',
      'inventory_batches',
      'job_cards',
      'job_card_items',
      'rotable_parts',
      'rotable_installations',
      'tools',
      'tool_checkouts',
      'exchange_rates',
      'audit_logs',
      'company_details',
      'stock_movements',
      'profile_security_log'
    ];
    
    migrationStats.totalTables = tablesToMigrate.length;
    
    // Process each table
    for (const tableName of tablesToMigrate) {
      try {
        log(`\n📋 Processing table: ${tableName}`);
        
        // Get table data with retry
        const data = await retryWithBackoff(async () => {
          return await getAllDataFromTable(tableName);
        });
        
        if (data.length > 0) {
          // Create MySQL table from data structure
          const tableCreated = await createMySQLTableFromData(tableName, data, connection);
          
          if (tableCreated) {
            // Insert data into MySQL
            const result = await insertMySQLData(tableName, data, connection);
            
            migrationStats.successfulTables++;
            migrationStats.totalRows += data.length;
            migrationStats.successfulRows += result.success;
            migrationStats.failedRows += result.failed;
            
            // Validate row counts
            const supabaseCount = await getSupabaseRowCount(tableName);
            const mysqlCount = await getMySQLRowCount(tableName, connection);
            
            if (supabaseCount !== mysqlCount) {
              log(`⚠️  Row count mismatch for ${tableName}: Supabase=${supabaseCount}, MySQL=${mysqlCount}`, 'WARN');
            } else {
              log(`✅ Row count validation passed for ${tableName}: ${mysqlCount} rows`);
            }
            
            log(`✅ Successfully migrated table: ${tableName}`);
          } else {
            migrationStats.failedTables++;
            log(`❌ Failed to create table: ${tableName}`);
          }
        } else {
          log(`ℹ️  No data found for table: ${tableName}`);
          migrationStats.successfulTables++; // Count as success if no data
        }
        
      } catch (error) {
        migrationStats.failedTables++;
        logError(error, `migrateToMySQL(${tableName})`);
        log(`❌ Failed to migrate table: ${tableName}`);
        // Continue with other tables
      }
    }
    
    await connection.end();
    migrationStats.endTime = new Date();
    
    // Generate final report
    await generateFinalReport();
    
    log('\n🎉 Migration completed!');
    log(`📊 Final Statistics:`);
    log(`  - Total tables: ${migrationStats.totalTables}`);
    log(`  - Successful: ${migrationStats.successfulTables}`);
    log(`  - Failed: ${migrationStats.failedTables}`);
    log(`  - Total rows: ${migrationStats.totalRows}`);
    log(`  - Successful rows: ${migrationStats.successfulRows}`);
    log(`  - Failed rows: ${migrationStats.failedRows}`);
    log(`  - Retry attempts: ${migrationStats.retryCount}`);
    log(`  - Duration: ${Math.round((migrationStats.endTime - migrationStats.startTime) / 1000)}s`);
    
  } catch (error) {
    logError(error, 'migrateToMySQL');
    log(`❌ Migration failed: ${error.message}`, 'ERROR');
    process.exit(1);
  }
}

// Generate final migration report
async function generateFinalReport() {
  const reportPath = path.join(__dirname, 'final-migration-report.md');
  
  const report = `# Station-2100 MySQL Migration Report

## Migration Summary

**Migration Date:** ${migrationStats.startTime.toISOString()}
**Duration:** ${Math.round((migrationStats.endTime - migrationStats.startTime) / 1000)} seconds

## Statistics

| Metric | Count |
|--------|-------|
| Total Tables | ${migrationStats.totalTables} |
| Successful Tables | ${migrationStats.successfulTables} |
| Failed Tables | ${migrationStats.failedTables} |
| Total Rows Processed | ${migrationStats.totalRows} |
| Successful Rows | ${migrationStats.successfulRows} |
| Failed Rows | ${migrationStats.failedRows} |
| Retry Attempts | ${migrationStats.retryCount} |

## Success Rate

- **Table Success Rate:** ${Math.round((migrationStats.successfulTables / migrationStats.totalTables) * 100)}%
- **Row Success Rate:** ${migrationStats.totalRows > 0 ? Math.round((migrationStats.successfulRows / migrationStats.totalRows) * 100) : 0}%

## Errors

${migrationStats.errors.length > 0 ? migrationStats.errors.map(error => `- **${error.context}**: ${error.message}`).join('\n') : 'No errors encountered.'}

## Database Configuration

- **MySQL Host:** ${MYSQL_CONFIG.host}
- **MySQL Port:** ${MYSQL_CONFIG.port}
- **MySQL Database:** ${MYSQL_CONFIG.database}
- **Supabase URL:** ${SUPABASE_URL}

## Files Generated

- **Migration Log:** \`mysql/logs/migration.log\`
- **Error Log:** \`mysql/logs/migration-errors.log\`
- **Schema File:** \`mysql/schema/station2100_mysql_schema.sql\`

---
*Report generated on ${new Date().toISOString()}*
`;

  fs.writeFileSync(reportPath, report);
  log(`📄 Final report generated: ${reportPath}`);
}

// Run migration
if (require.main === module) {
  migrateToMySQL().catch(error => {
    log(`💥 Fatal error: ${error.message}`, 'ERROR');
    process.exit(1);
  });
}

module.exports = { migrateToMySQL };
