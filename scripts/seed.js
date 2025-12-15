import pg from "pg"
import bcrypt from "bcryptjs"
import "dotenv/config"

const { Pool } = pg

async function run() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error("NEXT_PUBLIC_SUPABASE_URL is not set")
    process.exit(1)
  }

  const pool = new Pool({ connectionString: process.env.NEXT_PUBLIC_SUPABASE_URL })
  
  try {
    const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@example.com"
    const adminPass = process.env.SEED_ADMIN_PASSWORD || "AdminPass123!"
    const hash = await bcrypt.hash(adminPass, 12)

    console.log("Seeding roles/users...")
    
    // Check if admin exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [adminEmail])
    if (existing.rows.length === 0) {
      await pool.query(`
        INSERT INTO users (email, password_hash, name, role)
        VALUES ($1, $2, $3, $4)
      `, [adminEmail, hash, 'Admin User', 'admin'])
      console.log(`✓ Created admin user: ${adminEmail} / ${adminPass}`)
    } else {
      console.log("⏭ Admin already exists, skipping")
    }

    // Create a manager and user for demo
    const manager = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', ['manager@example.com'])
    if (manager.rows.length === 0) {
      const managerHash = await bcrypt.hash("ManagerPass123!", 12)
      await pool.query(`
        INSERT INTO users (email, password_hash, name, role)
        VALUES ($1, $2, $3, $4)
      `, ['manager@example.com', managerHash, 'Manager User', 'manager'])
      console.log("✓ Created manager user: manager@example.com / ManagerPass123!")
    } else {
      console.log("⏭ Manager already exists, skipping")
    }

    const user = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', ['user@example.com'])
    if (user.rows.length === 0) {
      const userHash = await bcrypt.hash("UserPass123!", 12)
      await pool.query(`
        INSERT INTO users (email, password_hash, name, role)
        VALUES ($1, $2, $3, $4)
      `, ['user@example.com', userHash, 'Normal User', 'user'])
      console.log("✓ Created normal user: user@example.com / UserPass123!")
    } else {
      console.log("⏭ Normal user already exists, skipping")
    }

    console.log("✅ Seed complete")
  } catch (error) {
    console.error("Seeding failed:", error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
