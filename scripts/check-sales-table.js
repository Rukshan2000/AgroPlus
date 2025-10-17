/**
 * Check Sales Table Structure
 * This script checks the current structure of the sales table
 * and reports missing columns.
 */

import { query } from '../lib/db.js'

async function checkSalesTable() {
  try {
    console.log('Checking sales table structure...\n')

    // Get all columns from the sales table
    const result = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'sales'
      ORDER BY ordinal_position;
    `)

    if (result.rows.length === 0) {
      console.error('❌ Sales table does not exist!')
      return
    }

    console.log('Current columns in sales table:')
    console.log('================================')
    result.rows.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`)
    })

    // Check for required columns
    const requiredColumns = [
      'customer_id',
      'buying_price_at_sale',
      'profit_per_unit',
      'total_profit',
      'profit_margin_percentage'
    ]

    const existingColumns = result.rows.map(row => row.column_name)
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col))

    console.log('\n')
    if (missingColumns.length > 0) {
      console.log('❌ Missing columns:')
      missingColumns.forEach(col => console.log(`  - ${col}`))
      console.log('\nYou need to run the following migrations:')
      if (missingColumns.includes('customer_id')) {
        console.log('  - scripts/sql/loyalty-migration.sql')
      }
      if (missingColumns.some(col => ['buying_price_at_sale', 'profit_per_unit', 'total_profit', 'profit_margin_percentage'].includes(col))) {
        console.log('  - scripts/sql/014_add_sales_profit_tracking.sql')
      }
    } else {
      console.log('✅ All required columns exist!')
    }

    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

checkSalesTable()
