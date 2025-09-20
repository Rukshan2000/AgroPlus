import { readFileSync, readdirSync } from "fs"
import { join } from "path"
import pg from "pg"
import "dotenv/config"

const { Pool } = pg

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set")
    process.exit(1)
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  
  try {
    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
      )
    `)

    const dir = join(process.cwd(), "scripts", "sql")
    const files = readdirSync(dir)
      .filter((f) => f.match(/^\d+_.*\.sql$/))
      .sort()

    for (const file of files) {
      // Check if migration already executed
      const result = await pool.query('SELECT id FROM migrations WHERE filename = $1', [file])
      
      if (result.rows.length === 0) {
        const p = join(dir, file)
        const statement = readFileSync(p, "utf8")
        console.log(`Running migration: ${file}`)
        
        const client = await pool.connect()
        try {
          await client.query('BEGIN')
          await client.query(statement)
          await client.query('INSERT INTO migrations (filename) VALUES ($1)', [file])
          await client.query('COMMIT')
          console.log(`✓ Migration ${file} completed`)
        } catch (error) {
          await client.query('ROLLBACK')
          throw error
        } finally {
          client.release()
        }
      } else {
        console.log(`⏭ Migration ${file} already executed`)
      }
    }
    console.log("All migrations complete")
  } catch (error) {
    console.error("Migration failed:", error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
