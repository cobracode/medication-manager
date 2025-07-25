#!/usr/bin/env node

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDbConnection, closeDbConnection } from '../../core/src/database/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...');
    
    // Read the SQL schema file
    const schemaPath = join(__dirname, '../../core/src/database/schema.sql');
    const schemaSql = await readFile(schemaPath, 'utf-8');
    
    // Get database connection
    const connection = await getDbConnection();
    
    // Split the SQL into individual statements
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`   ${i + 1}/${statements.length}: Executing...`);
      
      try {
        await connection.execute(statement);
        console.log(`   ✅ Statement ${i + 1} executed successfully`);
      } catch (error) {
        console.error(`   ❌ Error in statement ${i + 1}:`, error);
        console.error(`   SQL: ${statement}`);
        throw error;
      }
    }
    
    console.log('✅ Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await closeDbConnection();
  }
}

// Run migration (always execute when imported as script)
runMigration();

export { runMigration };