import { query } from "../lib/db"

export async function findCategoryById(id) {
  const result = await query(
    'SELECT * FROM categories WHERE id = $1 LIMIT 1',
    [id]
  )
  return result.rows[0] || null
}

export async function findCategoryByName(name) {
  const result = await query('SELECT * FROM categories WHERE name = $1 LIMIT 1', [name])
  return result.rows[0] || null
}

export async function createCategory({ 
  name, 
  description, 
  color, 
  is_active = true, 
  created_by 
}) {
  const result = await query(`
    INSERT INTO categories (name, description, color, is_active, created_by)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [name, description, color, is_active, created_by])
  return result.rows[0]
}

export async function listCategories({ page = 1, limit = 10, search, is_active } = {}) {
  const offset = (page - 1) * limit
  let whereConditions = []
  let params = []
  let paramIndex = 1

  if (search) {
    whereConditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`)
    params.push(`%${search}%`)
    paramIndex++
  }

  if (is_active !== undefined) {
    whereConditions.push(`is_active = $${paramIndex}`)
    params.push(is_active)
    paramIndex++
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

  // Get total count
  const countResult = await query(`
    SELECT COUNT(*) as total
    FROM categories
    ${whereClause}
  `, params)

  // Get categories
  const result = await query(`
    SELECT c.*, u.name as created_by_name
    FROM categories c
    LEFT JOIN users u ON c.created_by = u.id
    ${whereClause}
    ORDER BY c.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `, [...params, limit, offset])

  return {
    categories: result.rows,
    total: parseInt(countResult.rows[0].total),
    page,
    limit,
    totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
  }
}

export async function updateCategory(id, { 
  name, 
  description, 
  color, 
  is_active 
}) {
  const result = await query(`
    UPDATE categories SET 
      name = $1, 
      description = $2, 
      color = $3, 
      is_active = $4,
      updated_at = NOW()
    WHERE id = $5
    RETURNING *
  `, [name, description, color, is_active, id])
  return result.rows[0] || null
}

export async function deleteCategory(id) {
  const result = await query('DELETE FROM categories WHERE id = $1 RETURNING *', [id])
  return result.rows[0] || null
}

export async function getActiveCategoryNames() {
  const result = await query(`
    SELECT name 
    FROM categories 
    WHERE is_active = true
    ORDER BY name
  `)
  return result.rows.map(row => row.name)
}

export async function getCategoryUsageCount(id) {
  const result = await query(`
    SELECT COUNT(*) as count 
    FROM products 
    WHERE category = (SELECT name FROM categories WHERE id = $1)
  `, [id])
  return parseInt(result.rows[0].count) || 0
}
