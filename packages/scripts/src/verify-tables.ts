#!/usr/bin/env node

import { getDbConnection, closeDbConnection } from '../../core/src/database/connection.js';

async function verifyTables() {
  try {
    console.log('🔍 Verifying database tables...');
    
    const connection = await getDbConnection();
    
    // Get list of tables
    const [tables] = await connection.execute('SHOW TABLES');
    
    console.log('\n📋 Database tables:');
    tables.forEach((row: any, index: number) => {
      console.log(`   ${index + 1}. ${Object.values(row)[0]}`);
    });
    
    // Verify each expected table exists
    const expectedTables = ['users', 'care_recipients', 'medication_doses', 'medication_templates', 'medication_history'];
    const actualTables = tables.map((row: any) => Object.values(row)[0]);
    
    console.log('\n✅ Table verification:');
    for (const table of expectedTables) {
      if (actualTables.includes(table)) {
        console.log(`   ✅ ${table} - exists`);
      } else {
        console.log(`   ❌ ${table} - missing`);
      }
    }
    
    console.log('\n🎉 Database verification completed!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await closeDbConnection();
  }
}

// Run verification
verifyTables();