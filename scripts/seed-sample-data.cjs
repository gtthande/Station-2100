const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

const prisma = new PrismaClient();

async function seedSampleData() {
  console.log('🌱 Seeding Sample Data for Station-2100...');
  
  try {
    // Connect to MySQL
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'station'
    });

    console.log('✅ Connected to MySQL database');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    await connection.execute('TRUNCATE TABLE inventory_batches');
    await connection.execute('TRUNCATE TABLE inventory_products');
    await connection.execute('TRUNCATE TABLE job_cards');
    await connection.execute('TRUNCATE TABLE customers');
    await connection.execute('TRUNCATE TABLE user_roles');
    await connection.execute('TRUNCATE TABLE exchange_rates');
    await connection.execute('TRUNCATE TABLE profiles');
    await connection.execute('TRUNCATE TABLE users');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Existing data cleared');

    // Create base user
    console.log('👤 Creating base user...');
    const baseUserId = 'd541f75c-eb0c-47c4-a1be-9b4b5a448ecd';
    const baseUserEmail = 'gtthande@gmail.com';
    
    await connection.execute(`
      INSERT INTO users (id, email, created_at, updated_at, is_super_admin) 
      VALUES (?, ?, NOW(), NOW(), ?)
    `, [baseUserId, baseUserEmail, true]);
    
    await connection.execute(`
      INSERT INTO profiles (id, user_id, email, full_name, position, created_at, updated_at, is_staff, staff_active) 
      VALUES (?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)
    `, [baseUserId, baseUserId, baseUserEmail, 'Test User', 'admin', true, true]);
    
    console.log('✅ Base user created');

    // Create sample inventory products
    console.log('📦 Creating sample inventory products...');
    const sampleProducts = [
      {
        id: 'fcac92c0-c2c1-4134-b220-bfd895fbe92b',
        part_number: '16356',
        description: 'MAP LIGHT',
        unit_of_measure: 'PCS',
        unit_cost: 12.71,
        category: 'ELECTRICAL',
        active: true
      },
      {
        id: 'c53656f3-3175-46e2-9764-d81e55821456',
        part_number: '16357',
        description: 'BRACKET',
        unit_of_measure: 'PCS',
        unit_cost: 77.7,
        category: 'MECHANICAL',
        active: true
      },
      {
        id: 'fa2a6f9c-f4c6-4dbd-a25a-8fd4ad30840d',
        part_number: '16358',
        description: 'BRACKET',
        unit_of_measure: 'PCS',
        unit_cost: 57.05,
        category: 'MECHANICAL',
        active: true
      },
      {
        id: '247cc344-9ec8-4be7-9e88-e4063102cb61',
        part_number: '16359',
        description: 'HINGE DOOR',
        unit_of_measure: 'PCS',
        unit_cost: 905,
        category: 'MECHANICAL',
        active: true
      },
      {
        id: '70eb41aa-ecd0-48bf-aa65-f5424997d679',
        part_number: '16361',
        description: 'HINGE DOOR',
        unit_of_measure: 'PCS',
        unit_cost: 895.98,
        category: 'MECHANICAL',
        active: true
      }
    ];

    for (const product of sampleProducts) {
      await connection.execute(`
        INSERT INTO inventory_products (
          id, user_id, part_number, description, unit_of_measure, 
          unit_cost, category, active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        product.id, baseUserId, product.part_number, product.description,
        product.unit_of_measure, product.unit_cost, product.category, product.active
      ]);
    }
    
    console.log(`✅ Created ${sampleProducts.length} sample inventory products`);

    // Create sample inventory batches
    console.log('📦 Creating sample inventory batches...');
    const sampleBatches = [
      {
        id: 'batch-001',
        product_id: 'fcac92c0-c2c1-4134-b220-bfd895fbe92b',
        batch_number: 'BATCH-001',
        quantity: 10,
        unit_cost: 12.71,
        supplier: 'Test Supplier 1',
        purchase_date: '2025-01-01',
        expiry_date: '2026-01-01'
      },
      {
        id: 'batch-002',
        product_id: 'c53656f3-3175-46e2-9764-d81e55821456',
        batch_number: 'BATCH-002',
        quantity: 5,
        unit_cost: 77.7,
        supplier: 'Test Supplier 2',
        purchase_date: '2025-01-02',
        expiry_date: '2026-01-02'
      }
    ];

    for (const batch of sampleBatches) {
      await connection.execute(`
        INSERT INTO inventory_batches (
          id, product_id, batch_number, quantity, unit_cost, 
          supplier, purchase_date, expiry_date, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        batch.id, batch.product_id, batch.batch_number, batch.quantity,
        batch.unit_cost, batch.supplier, batch.purchase_date, batch.expiry_date
      ]);
    }
    
    console.log(`✅ Created ${sampleBatches.length} sample inventory batches`);

    // Create sample customers
    console.log('👥 Creating sample customers...');
    const sampleCustomers = [
      {
        id: 'customer-001',
        name: 'Test Customer 1',
        email: 'customer1@test.com',
        phone: '+254700000001',
        address: 'Test Address 1'
      },
      {
        id: 'customer-002',
        name: 'Test Customer 2',
        email: 'customer2@test.com',
        phone: '+254700000002',
        address: 'Test Address 2'
      }
    ];

    for (const customer of sampleCustomers) {
      await connection.execute(`
        INSERT INTO customers (
          id, user_id, name, email, phone, address, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        customer.id, baseUserId, customer.name, customer.email,
        customer.phone, customer.address
      ]);
    }
    
    console.log(`✅ Created ${sampleCustomers.length} sample customers`);

    // Create sample job cards
    console.log('📋 Creating sample job cards...');
    const sampleJobCards = [
      {
        id: 'job-001',
        customer_id: 'customer-001',
        customername: 'Test Customer 1',
        description: 'Test Job Description 1',
        status: 'pending',
        priority: 'medium'
      },
      {
        id: 'job-002',
        customer_id: 'customer-002',
        customername: 'Test Customer 2',
        description: 'Test Job Description 2',
        status: 'in_progress',
        priority: 'high'
      }
    ];

    for (const jobCard of sampleJobCards) {
      await connection.execute(`
        INSERT INTO job_cards (
          id, customer_id, customername, description, status, priority, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        jobCard.id, jobCard.customer_id, jobCard.customername,
        jobCard.description, jobCard.status, jobCard.priority
      ]);
    }
    
    console.log(`✅ Created ${sampleJobCards.length} sample job cards`);

    // Create user roles
    console.log('👤 Creating user roles...');
    await connection.execute(`
      INSERT INTO user_roles (id, user_id, role_name, created_at) 
      VALUES (?, ?, ?, NOW())
    `, ['role-001', baseUserId, 'admin']);
    
    await connection.execute(`
      INSERT INTO user_roles (id, user_id, role_name, created_at) 
      VALUES (?, ?, ?, NOW())
    `, ['role-002', baseUserId, 'parts_approver']);
    
    console.log('✅ Created user roles');

    // Create exchange rates
    console.log('💱 Creating exchange rates...');
    const exchangeRates = [
      { from_currency: 'USD', to_currency: 'KES', rate: 150, date: '2025-01-30' },
      { from_currency: 'EUR', to_currency: 'KES', rate: 165, date: '2025-01-30' },
      { from_currency: 'GBP', to_currency: 'KES', rate: 190, date: '2025-01-30' }
    ];

    for (const rate of exchangeRates) {
      await connection.execute(`
        INSERT INTO exchange_rates (id, from_currency, to_currency, rate, date, created_at) 
        VALUES (?, ?, ?, ?, ?, NOW())
      `, [
        `rate-${rate.from_currency}-${rate.to_currency}`,
        rate.from_currency, rate.to_currency, rate.rate, rate.date
      ]);
    }
    
    console.log(`✅ Created ${exchangeRates.length} exchange rates`);

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
    
    console.log('\n🎉 Sample data seeding completed successfully!');
    console.log('🚀 Station-2100 is now ready with sample data!');
    
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedSampleData().catch(console.error);



