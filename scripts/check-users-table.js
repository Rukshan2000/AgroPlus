/**
 * Check Users Table Structure
 */

import { query } from '../lib/db.js'

async function checkUsersTable() {
  try {
    console.log('Checking users table structure...\n')

    const result = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `)

    console.log('Columns in users table:')
    console.log('======================')
    result.rows.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type})`)
    })

    const hasUsername = result.rows.some(col => col.column_name === 'username')
    const hasName = result.rows.some(col => col.column_name === 'name')
    
    console.log('\n')
    console.log(`Has 'username' column: ${hasUsername ? '✅' : '❌'}`)
    console.log(`Has 'name' column: ${hasName ? '✅' : '❌'}`)

    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

checkUsersTable()
