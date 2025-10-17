#!/usr/bin/env node

/**
 * Migration script to create the returns table
 * Run with: node scripts/migrate-returns.js
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { query } from '../lib/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('Starting returns table migration...\n');

    // Read the SQL file
    const sqlPath = join(__dirname, 'sql', 'create-returns-table.sql');
    const sql = readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    console.log('Executing SQL migration...');
    await query(sql);

    console.log('✅ Returns table created successfully!');
    console.log('✅ Return status column added to sales table!');
    console.log('✅ Indexes created!');
    console.log('\nMigration completed successfully!\n');

    // Verify the table was created
    const result = await query(`
      SELECT 
        table_name, 
        column_name, 
        data_type 
      FROM information_schema.columns 
      WHERE table_name = 'product_returns'
      ORDER BY ordinal_position
    `);

    console.log('Table structure:');
    console.table(result.rows);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
