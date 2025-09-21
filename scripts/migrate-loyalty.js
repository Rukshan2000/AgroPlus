import { getDb } from "../lib/db.js"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function migrateLoyalty() {
  const db = getDb()
  
  try {
    console.log('Starting loyalty system migration...')
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'sql', 'loyalty-migration.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Execute the migration
    await db.query(sql)
    
    console.log('✅ Loyalty system migration completed successfully')
    console.log('Created tables:')
    console.log('  - loyalty_programs')
    console.log('  - customers')
    console.log('  - loyalty_transactions')
    console.log('  - rewards')
    console.log('  - redemptions')
    console.log('  - Added indexes and triggers')
    console.log('  - Inserted default loyalty program')
    
  } catch (error) {
    console.error('❌ Loyalty migration failed:', error)
    throw error
  } finally {
    // Close the pool connection
    await db.end()
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateLoyalty()
    .then(() => {
      console.log('Migration script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration script failed:', error)
      process.exit(1)
    })
}

export { migrateLoyalty }
