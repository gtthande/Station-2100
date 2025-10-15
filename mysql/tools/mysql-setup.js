const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// MySQL connection configuration
const mysqlConfig = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '',
  database: 'station2100_mysql_shadow'
};

async function setupMySQLDatabase() {
  let connection;
  
  try {
    console.log('Connecting to MySQL...');
    
    // First connect without database to create it
    const tempConnection = await mysql.createConnection({
      host: mysqlConfig.host,
      port: mysqlConfig.port,
      user: mysqlConfig.user,
      password: mysqlConfig.password
    });
    
    console.log('Creating database...');
    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${mysqlConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await tempConnection.end();
    
    // Now connect to the specific database
    connection = await mysql.createConnection(mysqlConfig);
    console.log('Connected to MySQL database successfully!');
    
    // Read and execute schema
    console.log('Reading schema file...');
    const schemaPath = path.join(__dirname, '../../mysql/ddl/station2100_mysql_schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Executing schema...');
    const schemaStatements = schemaSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of schemaStatements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          console.log('✓ Executed schema statement');
        } catch (error) {
          console.error('✗ Schema statement failed:', error.message);
          console.error('Statement:', statement.substring(0, 100) + '...');
        }
      }
    }
    
    // Read and execute data
    console.log('Reading data file...');
    const dataPath = path.join(__dirname, '../../mysql/data/station2100_mysql_data.sql');
    const dataSQL = fs.readFileSync(dataPath, 'utf8');
    
    console.log('Executing data inserts...');
    const dataStatements = dataSQL.split(';').filter(stmt => stmt.trim());
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of dataStatements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          successCount++;
          if (successCount % 100 === 0) {
            console.log(`✓ Executed ${successCount} data statements`);
          }
        } catch (error) {
          errorCount++;
          console.error('✗ Data statement failed:', error.message);
          if (errorCount <= 5) { // Only show first 5 errors
            console.error('Statement:', statement.substring(0, 100) + '...');
          }
        }
      }
    }
    
    console.log(`\nData import completed: ${successCount} successful, ${errorCount} errors`);
    
    // Verify the import
    console.log('\nVerifying import...');
    
    // Get table count
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`Tables created: ${tables.length}`);
    
    // Get row counts for each table
    console.log('\nRow counts by table:');
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
        console.log(`  ${tableName}: ${rows[0].count} rows`);
      } catch (error) {
        console.log(`  ${tableName}: Error counting rows - ${error.message}`);
      }
    }
    
    // Check if users table exists and has data
    try {
      const [users] = await connection.execute('SELECT COUNT(*) as count FROM `profiles`');
      console.log(`\nUsers (profiles) table: ${users[0].count} rows`);
      
      if (users[0].count > 0) {
        const [userData] = await connection.execute('SELECT id, email, full_name FROM `profiles` LIMIT 3');
        console.log('Sample users:');
        userData.forEach(user => {
          console.log(`  - ${user.email} (${user.full_name})`);
        });
      }
    } catch (error) {
      console.log('Error checking users table:', error.message);
    }
    
    console.log('\nMySQL database setup completed successfully!');
    
  } catch (error) {
    console.error('Error setting up MySQL database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the setup
setupMySQLDatabase().catch(console.error);
