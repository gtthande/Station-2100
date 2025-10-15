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
  const logFile = path.join(__dirname, '../logs/mysql-connection.log');
  fs.appendFileSync(logFile, logMessage + '\n');
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
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      log(`Attempt ${attempt} failed, retrying in ${delay}ms: ${error.message}`, 'WARN');
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function verifyMySQLConnection() {
  log('Starting MySQL connection verification...');
  
  try {
    // Test connection with retry
    await retryWithBackoff(async () => {
      const connection = await mysql.createConnection({
        host: MYSQL_CONFIG.host,
        port: MYSQL_CONFIG.port,
        user: MYSQL_CONFIG.user,
        password: MYSQL_CONFIG.password
      });
      
      log('✅ MySQL server connection successful');
      await connection.end();
    });
    
    // Create database with retry
    await retryWithBackoff(async () => {
      const connection = await mysql.createConnection({
        host: MYSQL_CONFIG.host,
        port: MYSQL_CONFIG.port,
        user: MYSQL_CONFIG.user,
        password: MYSQL_CONFIG.password
      });
      
      log(`Creating database: ${MYSQL_CONFIG.database}`);
      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_CONFIG.database}\``);
      log(`✅ Database ${MYSQL_CONFIG.database} created/verified`);
      
      await connection.end();
    });
    
    // Test connection with database
    await retryWithBackoff(async () => {
      const dbConnection = await mysql.createConnection(MYSQL_CONFIG);
      log('✅ Database connection successful');
      await dbConnection.end();
    });
    
    log('✅ All MySQL connection tests passed!');
    return true;
    
  } catch (error) {
    log(`❌ MySQL connection failed after all retries: ${error.message}`, 'ERROR');
    return false;
  }
}

// Run verification
if (require.main === module) {
  verifyMySQLConnection().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { verifyMySQLConnection, MYSQL_CONFIG };

