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

// PostgreSQL to MySQL type mapping
const TYPE_MAPPING = {
  'uuid': 'VARCHAR(36)',
  'text': 'TEXT',
  'varchar': 'VARCHAR',
  'integer': 'INT',
  'bigint': 'BIGINT',
  'boolean': 'BOOLEAN',
  'timestamp with time zone': 'DATETIME',
  'timestamp without time zone': 'DATETIME',
  'date': 'DATE',
  'time': 'TIME',
  'numeric': 'DECIMAL',
  'decimal': 'DECIMAL',
  'real': 'FLOAT',
  'double precision': 'DOUBLE',
  'json': 'JSON',
  'jsonb': 'JSON',
  'bytea': 'BLOB',
  'character varying': 'VARCHAR',
  'character': 'CHAR'
};

// Convert PostgreSQL column definition to MySQL
function convertColumnType(pgType, maxLength = null) {
  let mysqlType = TYPE_MAPPING[pgType.toLowerCase()] || 'TEXT';
  
  if (maxLength && (pgType.toLowerCase().includes('varchar') || pgType.toLowerCase().includes('character'))) {
    mysqlType = `VARCHAR(${maxLength})`;
  }
  
  return mysqlType;
}

// Get all tables from Supabase
async function getSupabaseTables() {
  try {
    log('Fetching table information from Supabase...');
    
    // Get table list from information_schema
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');
    
    if (error) {
      log(`Error fetching tables: ${error.message}`, 'ERROR');
      return [];
    }
    
    log(`Found ${tables.length} tables in Supabase`);
    return tables.map(t => t.table_name);
  } catch (error) {
    log(`Error connecting to Supabase: ${error.message}`, 'ERROR');
    return [];
  }
}

// Get table schema from Supabase
async function getTableSchema(tableName) {
  try {
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default, character_maximum_length')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .order('ordinal_position');
    
    if (error) {
      log(`Error fetching schema for ${tableName}: ${error.message}`, 'ERROR');
      return null;
    }
    
    return columns;
  } catch (error) {
    log(`Error getting schema for ${tableName}: ${error.message}`, 'ERROR');
    return null;
  }
}

// Get table data from Supabase
async function getTableData(tableName) {
  try {
    log(`Fetching data from table: ${tableName}`);
    
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

// Create MySQL table
async function createMySQLTable(tableName, columns, connection) {
  try {
    log(`Creating MySQL table: ${tableName}`);
    
    let createTableSQL = `CREATE TABLE IF NOT EXISTS \`${tableName}\` (\n`;
    
    const columnDefinitions = columns.map(col => {
      const mysqlType = convertColumnType(col.data_type, col.character_maximum_length);
      const nullable = col.is_nullable === 'YES' ? '' : 'NOT NULL';
      const defaultValue = col.column_default ? `DEFAULT ${col.column_default}` : '';
      
      return `  \`${col.column_name}\` ${mysqlType} ${nullable} ${defaultValue}`.trim();
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
      const values = columns.map(col => row[col]);
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
      // Get all tables from Supabase
      const tables = await getSupabaseTables();
      
      if (tables.length === 0) {
        log('No tables found in Supabase', 'WARN');
        return;
      }
      
      // Process each table
      for (const tableName of tables) {
        try {
          log(`Processing table: ${tableName}`);
          
          // Get table schema
          const columns = await getTableSchema(tableName);
          if (!columns) {
            log(`Skipping table ${tableName} due to schema error`, 'WARN');
            continue;
          }
          
          // Create MySQL table
          await createMySQLTable(tableName, columns, connection);
          
          // Get table data
          const data = await getTableData(tableName);
          
          // Insert data into MySQL
          await insertMySQLData(tableName, data, connection);
          
          log(`Successfully migrated table: ${tableName}`);
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