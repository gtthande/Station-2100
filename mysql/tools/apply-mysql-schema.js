#!/usr/bin/env node

const mysql = require('mysql2/promise');
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

// Logging function
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type}] ${message}`;
  console.log(logMessage);
  
  // Write to log file
  const logFile = path.join(__dirname, '../logs/schema-application.log');
  fs.appendFileSync(logFile, logMessage + '\n');
}

async function applyMySQLSchema() {
  log('Starting MySQL schema application...');
  
  try {
    // Connect to MySQL
    const connection = await mysql.createConnection(MYSQL_CONFIG);
    log('✅ Connected to MySQL database');
    
    // Read schema file
    const schemaPath = path.join(__dirname, '../schema/station2100_mysql_schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    log(`✅ Schema file loaded: ${schemaPath}`);
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        if (statement.trim()) {
          await connection.execute(statement);
          successCount++;
          
          // Log table creation
          if (statement.toUpperCase().includes('CREATE TABLE')) {
            const tableMatch = statement.match(/CREATE TABLE.*?`([^`]+)`/i);
            if (tableMatch) {
              log(`✅ Created table: ${tableMatch[1]}`);
            }
          }
        }
      } catch (error) {
        errorCount++;
        log(`❌ Error executing statement ${i + 1}: ${error.message}`, 'ERROR');
        log(`Statement: ${statement.substring(0, 100)}...`, 'ERROR');
        
        // Continue with other statements
      }
    }
    
    // Verify tables were created
    const [tables] = await connection.execute('SHOW TABLES');
    log(`✅ Schema application completed. Created ${tables.length} tables`);
    
    // List all tables
    log('Tables created:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      log(`  - ${tableName}`);
    });
    
    await connection.end();
    
    log(`Schema application summary:`);
    log(`  - Statements executed: ${successCount}`);
    log(`  - Errors encountered: ${errorCount}`);
    log(`  - Tables created: ${tables.length}`);
    
    return { success: true, tablesCreated: tables.length, errors: errorCount };
    
  } catch (error) {
    log(`❌ Schema application failed: ${error.message}`, 'ERROR');
    return { success: false, error: error.message };
  }
}

// Run schema application
if (require.main === module) {
  applyMySQLSchema().then(result => {
    if (result.success) {
      log('✅ MySQL schema application completed successfully!');
      process.exit(0);
    } else {
      log(`❌ MySQL schema application failed: ${result.error}`);
      process.exit(1);
    }
  });
}

module.exports = { applyMySQLSchema };

