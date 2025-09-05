const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "berryseed",
  database: process.env.DB_NAME || "taskplanner"
});

async function verifyDatabase() {
  console.log('🔍 Verifying Database Structure\n');
  
  try {
    await new Promise((resolve, reject) => {
      db.connect((err) => {
        if (err) {
          console.error('❌ Database connection failed:', err.message);
          reject(err);
        } else {
          console.log('✅ Database connected successfully');
          resolve();
        }
      });
    });

    // List all tables
    const tables = await new Promise((resolve, reject) => {
      db.query("SHOW TABLES", (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    console.log(`\n📋 Found ${tables.length} tables:`);
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`  - ${tableName}`);
    });

    // Expected tables
    const expectedTables = [
      'tasks', 'courses', 'study_sessions', 'user_preferences', 
      'users', 'notifications', 'time_blocks', 'availability_exceptions', 
      'class_schedule'
    ];

    console.log('\n🔍 Checking for expected tables:');
    for (const expectedTable of expectedTables) {
      const exists = tables.some(table => Object.values(table)[0] === expectedTable);
      console.log(`  ${exists ? '✅' : '❌'} ${expectedTable}`);
    }

    // Check table structures
    console.log('\n📊 Table Structures:');
    
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      console.log(`\n--- ${tableName.toUpperCase()} ---`);
      
      const structure = await new Promise((resolve, reject) => {
        db.query(`DESCRIBE ${tableName}`, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      structure.forEach(column => {
        console.log(`  ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key ? `(${column.Key})` : ''}`);
      });

      // Check record count
      const count = await new Promise((resolve, reject) => {
        db.query(`SELECT COUNT(*) as count FROM ${tableName}`, (err, results) => {
          if (err) reject(err);
          else resolve(results[0].count);
        });
      });
      console.log(`  Records: ${count}`);
    }

    // Check foreign key constraints
    console.log('\n🔗 Foreign Key Constraints:');
    const foreignKeys = await new Promise((resolve, reject) => {
      db.query(`
        SELECT 
          TABLE_NAME,
          COLUMN_NAME,
          CONSTRAINT_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE REFERENCED_TABLE_SCHEMA = '${process.env.DB_NAME || 'taskplanner'}'
        AND REFERENCED_TABLE_NAME IS NOT NULL
      `, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (foreignKeys.length > 0) {
      foreignKeys.forEach(fk => {
        console.log(`  ${fk.TABLE_NAME}.${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
      });
    } else {
      console.log('  No foreign key constraints found');
    }

    // Check indexes
    console.log('\n📇 Indexes:');
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      const indexes = await new Promise((resolve, reject) => {
        db.query(`SHOW INDEX FROM ${tableName}`, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      const uniqueIndexes = [...new Set(indexes.map(idx => idx.Key_name))];
      if (uniqueIndexes.length > 0) {
        console.log(`  ${tableName}: ${uniqueIndexes.join(', ')}`);
      }
    }

    console.log('\n✅ Database verification completed successfully!');

  } catch (error) {
    console.error('\n❌ Database verification failed:', error.message);
  } finally {
    db.end();
  }
}

verifyDatabase();
