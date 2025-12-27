import { query } from "../lib/db"

export async function findOutletById(id) {
  const result = await query(
    'SELECT * FROM outlets WHERE id = $1 LIMIT 1',
    [id]
  )
  return result.rows[0] || null
}

export async function findOutletByName(name) {
  const result = await query('SELECT * FROM outlets WHERE name = $1 LIMIT 1', [name])
  return result.rows[0] || null
}

export async function createOutlet({ 
  name, 
  location, 
  address,
  phone,
  email,
  manager,
  is_active = true, 
  created_by 
}) {
  const result = await query(`
    INSERT INTO outlets (name, location, address, phone, email, manager, is_active, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [name, location, address, phone, email, manager, is_active, created_by])
  return result.rows[0]
}

export async function listOutlets({ page = 1, limit = 10, search, is_active } = {}) {
  const offset = (page - 1) * limit
  let whereConditions = []
  let params = []
  let paramIndex = 1

  if (search) {
    whereConditions.push(`(name ILIKE $${paramIndex} OR location ILIKE $${paramIndex} OR address ILIKE $${paramIndex})`)
    params.push(`%${search}%`)
    paramIndex++
  }

  if (is_active !== undefined) {
    whereConditions.push(`is_active = $${paramIndex}`)
    params.push(is_active)
    paramIndex++
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

  const countResult = await query(
    `SELECT COUNT(*) as total FROM outlets ${whereClause}`,
    params
  )

  const dataResult = await query(
    `SELECT * FROM outlets ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  )

  return {
    outlets: dataResult.rows,
    total: parseInt(countResult.rows[0].total),
    page,
    limit,
    pages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
  }
}

export async function updateOutlet(id, updates) {
  const allowedFields = ['name', 'location', 'address', 'phone', 'email', 'manager', 'is_active']
  const fields = []
  const values = []
  let paramIndex = 1

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = $${paramIndex}`)
      values.push(value)
      paramIndex++
    }
  }

  if (fields.length === 0) {
    return await findOutletById(id)
  }

  values.push(id)
  const result = await query(
    `UPDATE outlets SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`,
    values
  )
  return result.rows[0]
}

export async function deleteOutlet(id) {
  const result = await query('DELETE FROM outlets WHERE id = $1 RETURNING *', [id])
  return result.rows[0]
}

export async function getActiveOutlets() {
  const result = await query('SELECT id, name FROM outlets WHERE is_active = true ORDER BY name')
  return result.rows
}
