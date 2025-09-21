console.log('Testing loyalty migration...')

try {
  const { getDb } = await import("../lib/db.js")
  console.log('Database module loaded')
  
  const db = getDb()
  console.log('Database connection established')
  
  // Test simple query
  const result = await db.query('SELECT NOW() as current_time')
  console.log('Database query successful:', result.rows[0])
  
  console.log('✅ Database connection test passed')
  process.exit(0)
} catch (error) {
  console.error('❌ Database connection test failed:', error)
  process.exit(1)
}
