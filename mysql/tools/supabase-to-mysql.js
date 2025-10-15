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

// Logging function
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type}] ${message}`;
  console.log(logMessage);
  
  // Write to log file
  const logFile = path.join(__dirname, '../logs/migration.log');
  fs.appendFileSync(logFile, logMessage + '\n');
}

// Create MySQL database
async function createMySQLDatabase() {
  const connection = await mysql.createConnection({
    host: MYSQL_CONFIG.host,
    port: MYSQL_CONFIG.port,
    user: MYSQL_CONFIG.user,
    password: MYSQL_CONFIG.password
  });
  
  try {
    log(`Creating MySQL database: ${MYSQL_CONFIG.database}`);
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_CONFIG.database}\``);
    log(`Database ${MYSQL_CONFIG.database} created successfully`);
  } catch (error) {
    log(`Error creating database: ${error.message}`, 'ERROR');
    throw error;
  } finally {
    await connection.end();
  }
}

// Get all data from a Supabase table
async function getAllDataFromTable(tableName) {
  try {
    log(`Fetching all data from table: ${tableName}`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      log(`Error fetching data from ${tableName}: ${error.message}`, 'ERROR');
      return [];
    }
    
    log(`Retrieved ${data.length} rows from ${tableName}`);
    return data;
  } catch (error) {
    log(`Error getting data from ${tableName}: ${error.message}`, 'ERROR');
    return [];
  }
}

// Create MySQL table from Supabase data structure
async function createMySQLTableFromData(tableName, data, connection) {
  if (data.length === 0) {
    log(`No data to create table structure for: ${tableName}`);
    return;
  }
  
  try {
    log(`Creating MySQL table: ${tableName}`);
    
    const firstRow = data[0];
    const columns = Object.keys(firstRow);
    
    let createTableSQL = `CREATE TABLE IF NOT EXISTS \`${tableName}\` (\n`;
    
    const columnDefinitions = columns.map(col => {
      const value = firstRow[col];
      let mysqlType = 'TEXT';
      
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
      
      return `  \`${col}\` ${mysqlType}`;
    });
    
    createTableSQL += columnDefinitions.join(',\n');
    createTableSQL += '\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
    
    await connection.execute(createTableSQL);
    log(`Table ${tableName} created successfully`);
  } catch (error) {
    log(`Error creating table ${tableName}: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Insert data into MySQL table
async function insertMySQLData(tableName, data, connection) {
  if (data.length === 0) {
    log(`No data to insert for table: ${tableName}`);
    return;
  }
  
  try {
    log(`Inserting ${data.length} rows into ${tableName}`);
    
    const columns = Object.keys(data[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO \`${tableName}\` (\`${columns.join('`, `')}\`) VALUES (${placeholders})`;
    
    for (const row of data) {
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
    }
    
    log(`Successfully inserted ${data.length} rows into ${tableName}`);
  } catch (error) {
    log(`Error inserting data into ${tableName}: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Main migration function
async function migrateToMySQL() {
  log('Starting Supabase to MySQL migration...');
  
  try {
    // Create MySQL database
    await createMySQLDatabase();
    
    // Connect to MySQL
    const connection = await mysql.createConnection(MYSQL_CONFIG);
    
    try {
      // List of tables to migrate (based on the Station-2100 schema)
      const tablesToMigrate = [
        'profiles',
        'user_roles',
        'custom_roles',
        'inventory_products',
        'inventory_batches',
        'customers',
        'job_cards',
        'job_card_items',
        'rotable_parts',
        'rotable_installations',
        'rotable_repairs',
        'tools',
        'tool_checkouts',
        'exchange_rates',
        'audit_logs',
        'company_details',
        'compliance_documents',
        'stock_movements',
        'inventory_pooling',
        'flight_tracking',
        'installation_logs',
        'repair_exchange',
        'rotable_alerts',
        'rotable_reports',
        'rotable_roles',
        'stock_movements',
        'user_roles'
      ];
      
      // Process each table
      for (const tableName of tablesToMigrate) {
        try {
          log(`Processing table: ${tableName}`);
          
          // Get table data
          const data = await getAllDataFromTable(tableName);
          
          if (data.length > 0) {
            // Create MySQL table from data structure
            await createMySQLTableFromData(tableName, data, connection);
            
            // Insert data into MySQL
            await insertMySQLData(tableName, data, connection);
            
            log(`Successfully migrated table: ${tableName}`);
          } else {
            log(`No data found for table: ${tableName}`);
          }
        } catch (error) {
          log(`Error processing table ${tableName}: ${error.message}`, 'ERROR');
          // Continue with other tables
        }
      }
      
      log('Migration completed successfully!');
      
    } finally {
      await connection.end();
    }
    
  } catch (error) {
    log(`Migration failed: ${error.message}`, 'ERROR');
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  migrateToMySQL().catch(error => {
    log(`Fatal error: ${error.message}`, 'ERROR');
    process.exit(1);
  });
}

module.exports = { migrateToMySQL };
