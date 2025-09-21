import { getDb } from '../lib/db.js'

async function checkLoyaltyTables() {
  const db = getDb()
  
  try {
    console.log('Checking for loyalty system tables...')
    
    const result = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%customer%' 
           OR table_name LIKE '%loyalty%' 
           OR table_name LIKE '%reward%'
           OR table_name LIKE '%redemption%')
      ORDER BY table_name
    `)
    
    console.log('Found tables:', result.rows.map(r => r.table_name))
    
    if (result.rows.length === 0) {
      console.log('❌ No loyalty tables found. Migration may have failed.')
    } else {
      console.log('✅ Loyalty tables found!')
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error)
  } finally {
    await db.end()
  }
}

checkLoyaltyTables()
