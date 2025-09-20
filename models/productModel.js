import { query } from "../lib/db"

export async function findProductById(id) {
  const result = await query(
    'SELECT * FROM products WHERE id = $1 LIMIT 1',
    [id]
  )
  return result.rows[0] || null
}

export async function findProductBySku(sku) {
  const result = await query('SELECT * FROM products WHERE sku = $1 LIMIT 1', [sku])
  return result.rows[0] || null
}

export async function createProduct({ 
  name, 
  description, 
  price, 
  buying_price = 0.00,
  selling_price,
  sku, 
  category, 
  stock_quantity = 0, 
  is_active = true, 
  image_url, 
  created_by,
  unit_type = 'kg',
  unit_value = 1.000
}) {
  // Use selling_price if provided, otherwise fall back to price for backward compatibility
  const finalSellingPrice = selling_price || price || 0.00;
  
  const result = await query(`
    INSERT INTO products (name, description, price, buying_price, selling_price, sku, category, stock_quantity, is_active, image_url, created_by, unit_type, unit_value)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `, [name, description, finalSellingPrice, buying_price, finalSellingPrice, sku, category, stock_quantity, is_active, image_url, created_by, unit_type, unit_value])
  return result.rows[0]
}

export async function listProducts({ page = 1, limit = 10, category, search, is_active } = {}) {
  const offset = (page - 1) * limit
  let whereConditions = []
  let params = []
  let paramIndex = 1

  if (category) {
    whereConditions.push(`category = $${paramIndex}`)
    params.push(category)
    paramIndex++
  }

  if (search) {
    whereConditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR sku ILIKE $${paramIndex})`)
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
    FROM products
    ${whereClause}
  `, params)

  // Get products
  const result = await query(`
    SELECT p.*, u.name as created_by_name
    FROM products p
    LEFT JOIN users u ON p.created_by = u.id
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `, [...params, limit, offset])

  return {
    products: result.rows,
    total: parseInt(countResult.rows[0].total),
    page,
    limit,
    totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
  }
}

export async function updateProduct(id, { 
  name, 
  description, 
  price, 
  buying_price,
  selling_price,
  sku, 
  category, 
  stock_quantity, 
  is_active, 
  image_url,
  unit_type,
  unit_value
}) {
  // Use selling_price if provided, otherwise fall back to price for backward compatibility
  const finalSellingPrice = selling_price || price;
  
  const result = await query(`
    UPDATE products SET 
      name = $1, 
      description = $2, 
      price = $3, 
      buying_price = $4,
      selling_price = $5,
      sku = $6, 
      category = $7, 
      stock_quantity = $8, 
      is_active = $9, 
      image_url = $10,
      unit_type = $11,
      unit_value = $12,
      updated_at = NOW()
    WHERE id = $13
    RETURNING *
  `, [name, description, finalSellingPrice, buying_price, finalSellingPrice, sku, category, stock_quantity, is_active, image_url, unit_type, unit_value, id])
  return result.rows[0] || null
}

export async function deleteProduct(id) {
  const result = await query('DELETE FROM products WHERE id = $1 RETURNING *', [id])
  return result.rows[0] || null
}

export function getAvailableUnits() {
  return [
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'g', label: 'Grams (g)' },
    { value: 'l', label: 'Liters (l)' },
    { value: 'ml', label: 'Milliliters (ml)' },
    { value: 'items', label: 'Items' },
    { value: 'pcs', label: 'Pieces' },
    { value: 'bags', label: 'Bags' },
    { value: 'bottles', label: 'Bottles' },
    { value: 'packets', label: 'Packets' }
  ]
}

export async function updateProductQuantities(id, { sold_quantity, available_quantity }) {
  const result = await query(`
    UPDATE products SET 
      sold_quantity = $1,
      available_quantity = $2,
      updated_at = NOW()
    WHERE id = $3
    RETURNING *
  `, [sold_quantity, available_quantity, id])
  return result.rows[0] || null
}

export async function adjustStock(id, quantity_change) {
  const result = await query(`
    UPDATE products SET 
      stock_quantity = stock_quantity + $1,
      available_quantity = available_quantity + $1,
      updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `, [quantity_change, id])
  return result.rows[0] || null
}

export async function getProductsLowStock(threshold = 10) {
  const result = await query(`
    SELECT * FROM products 
    WHERE available_quantity <= $1 AND is_active = true
    ORDER BY available_quantity ASC
  `, [threshold])
  return result.rows
}
