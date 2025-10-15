#!/usr/bin/env node

const mysql = require('mysql2/promise');
require('dotenv').config();

// Environment variables
const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DB || 'station2100_mysql_shadow'
};

async function testMySQLConnection() {
  console.log('Testing MySQL connection...');
  console.log('Config:', {
    host: MYSQL_CONFIG.host,
    port: MYSQL_CONFIG.port,
    user: MYSQL_CONFIG.user,
    database: MYSQL_CONFIG.database
  });
  
  try {
    // Test connection without database first
    const connection = await mysql.createConnection({
      host: MYSQL_CONFIG.host,
      port: MYSQL_CONFIG.port,
      user: MYSQL_CONFIG.user,
      password: MYSQL_CONFIG.password
    });
    
    console.log('✅ MySQL server connection successful');
    
    // Create database
    console.log(`Creating database: ${MYSQL_CONFIG.database}`);
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_CONFIG.database}\``);
    console.log(`✅ Database ${MYSQL_CONFIG.database} created/verified`);
    
    await connection.end();
    
    // Test connection with database
    const dbConnection = await mysql.createConnection(MYSQL_CONFIG);
    console.log('✅ Database connection successful');
    
    await dbConnection.end();
    console.log('✅ All MySQL tests passed!');
    
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    process.exit(1);
  }
}

testMySQLConnection();
