import pg from "pg"
const { Pool } = pg

// Create a singleton PostgreSQL pool for server-side usage
let pool
export function getDb() {
  if (!pool) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set")
    }
    pool = new Pool({
      connectionString: process.env.NEXT_PUBLIC_SUPABASE_URL,
      max: 5, // Reduced for serverless (Vercel kills long-lived connections)
      idleTimeoutMillis: 10000, // Close idle clients after 10 seconds
      connectionTimeoutMillis: 15000, // Increase to 15 seconds for Supabase remote connection
      query_timeout: 30000, // 30 second query timeout
      statement_timeout: 30000, // 30 second statement timeout
      application_name: 'saas-app', // Helps with connection identification
    })
  }
  return pool
}

// Helper function to execute queries
export async function query(text, params) {
  const pool = getDb()
  const client = await pool.connect()
  try {
    // Set statement timeout for this query
    await client.query('SET statement_timeout = 30000')
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}

// Helper for transactions
export async function withTransaction(fn) {
  const pool = getDb()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
