/**
 * Test Sales Query
 * This script tests the exact query used in the listSales function
 */

import { query } from '../lib/db.js'

async function testSalesQuery() {
  try {
    console.log('Testing sales query...\n')

    const result = await query(`
      SELECT s.*, p.sku, p.category, u.name as sold_by
      FROM sales s
      LEFT JOIN products p ON s.product_id = p.id
      LEFT JOIN users u ON s.created_by = u.id
      ORDER BY s.created_at DESC
      LIMIT 10 OFFSET 0
    `)

    console.log('✅ Query successful. Rows returned:', result.rows.length)
    
    if (result.rows.length > 0) {
      console.log('\nSample row:')
      console.log(JSON.stringify(result.rows[0], null, 2))
    } else {
      console.log('\nNo sales records found in database.')
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Query error:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

testSalesQuery()
