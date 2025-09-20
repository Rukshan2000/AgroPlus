import { query } from "../lib/db"

export async function findUserByEmail(email) {
  const result = await query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email])
  return result.rows[0] || null
}

export async function findUserById(id) {
  const result = await query(
    'SELECT id, email, name, role, theme_preference, created_at, updated_at FROM users WHERE id = $1 LIMIT 1',
    [id]
  )
  return result.rows[0] || null
}

export async function createUser({ email, password_hash, name, role = "user" }) {
  const result = await query(`
    INSERT INTO users (email, password_hash, name, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, email, name, role, theme_preference, created_at, updated_at
  `, [email, password_hash, name, role])
  return result.rows[0]
}

export async function listUsers() {
  const result = await query(`
    SELECT id, email, name, role, theme_preference, created_at
    FROM users
    ORDER BY created_at DESC
  `)
  return result.rows
}

export async function updateUserRole(id, role) {
  const result = await query(`
    UPDATE users SET role = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, email, name, role, theme_preference
  `, [role, id])
  return result.rows[0] || null
}

export async function updateUserTheme(id, theme) {
  const result = await query(`
    UPDATE users SET theme_preference = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, email, name, role, theme_preference
  `, [theme, id])
  return result.rows[0] || null
}
