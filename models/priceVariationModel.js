import { query } from "../lib/db"

/**
 * Find all price variations for a product
 */
export async function findPriceVariationsByProductId(productId) {
  const result = await query(
    `SELECT ppv.*, u.name as created_by_name
     FROM product_price_variations ppv
     LEFT JOIN users u ON ppv.created_by = u.id
     WHERE ppv.product_id = $1
     ORDER BY ppv.sort_order ASC, ppv.is_default DESC, ppv.created_at ASC`,
    [productId]
  )
  return result.rows
}

/**
 * Find a specific price variation by ID
 */
export async function findPriceVariationById(id) {
  const result = await query(
    `SELECT ppv.*, u.name as created_by_name
     FROM product_price_variations ppv
     LEFT JOIN users u ON ppv.created_by = u.id
     WHERE ppv.id = $1`,
    [id]
  )
  return result.rows[0] || null
}

/**
 * Create a new price variation for a product
 */
export async function createPriceVariation({
  product_id,
  variant_name,
  price,
  buying_price = 0.00,
  is_default = false,
  is_active = true,
  stock_quantity = 0,
  sku_suffix = null,
  description = null,
  sort_order = 0,
  created_by
}) {
  // If this is set as default, unset other defaults for this product
  if (is_default) {
    await query(
      `UPDATE product_price_variations 
       SET is_default = false 
       WHERE product_id = $1`,
      [product_id]
    )
  }

  const result = await query(
    `INSERT INTO product_price_variations (
      product_id, variant_name, price, buying_price, is_default, 
      is_active, stock_quantity, sku_suffix, description, sort_order, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      product_id, variant_name, price, buying_price, is_default,
      is_active, stock_quantity, sku_suffix, description, sort_order, created_by
    ]
  )
  return result.rows[0]
}

/**
 * Update an existing price variation
 */
export async function updatePriceVariation(id, updates) {
  const allowedFields = [
    'variant_name', 'price', 'buying_price', 'is_default', 
    'is_active', 'stock_quantity', 'sku_suffix', 'description', 'sort_order'
  ]
  
  const updateFields = []
  const values = []
  let paramIndex = 1

  // If setting as default, unset other defaults first
  if (updates.is_default === true) {
    const variation = await findPriceVariationById(id)
    if (variation) {
      await query(
        `UPDATE product_price_variations 
         SET is_default = false 
         WHERE product_id = $1 AND id != $2`,
        [variation.product_id, id]
      )
    }
  }

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      updateFields.push(`${field} = $${paramIndex}`)
      values.push(updates[field])
      paramIndex++
    }
  }

  if (updateFields.length === 0) {
    return findPriceVariationById(id)
  }

  updateFields.push(`updated_at = NOW()`)
  values.push(id)

  const result = await query(
    `UPDATE product_price_variations 
     SET ${updateFields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  )
  return result.rows[0]
}

/**
 * Delete a price variation
 */
export async function deletePriceVariation(id) {
  const result = await query(
    `DELETE FROM product_price_variations 
     WHERE id = $1 
     RETURNING *`,
    [id]
  )
  return result.rows[0]
}

/**
 * Get the default price variation for a product
 */
export async function getDefaultPriceVariation(productId) {
  const result = await query(
    `SELECT * FROM product_price_variations 
     WHERE product_id = $1 AND is_default = true AND is_active = true
     LIMIT 1`,
    [productId]
  )
  return result.rows[0] || null
}

/**
 * Get active price variations for a product
 */
export async function getActivePriceVariations(productId) {
  const result = await query(
    `SELECT * FROM product_price_variations 
     WHERE product_id = $1 AND is_active = true
     ORDER BY sort_order ASC, is_default DESC, created_at ASC`,
    [productId]
  )
  return result.rows
}

/**
 * Bulk create price variations for a product
 */
export async function bulkCreatePriceVariations(productId, variations, createdBy) {
  const results = []
  
  for (const variation of variations) {
    const result = await createPriceVariation({
      product_id: productId,
      variant_name: variation.variant_name,
      price: variation.price,
      buying_price: variation.buying_price || 0.00,
      is_default: variation.is_default || false,
      is_active: variation.is_active !== undefined ? variation.is_active : true,
      stock_quantity: variation.stock_quantity || 0,
      sku_suffix: variation.sku_suffix || null,
      description: variation.description || null,
      sort_order: variation.sort_order || 0,
      created_by: createdBy
    })
    results.push(result)
  }
  
  return results
}

/**
 * Update stock quantity for a price variation
 */
export async function updatePriceVariationStock(id, quantityChange) {
  const result = await query(
    `UPDATE product_price_variations 
     SET stock_quantity = stock_quantity + $1,
         updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [quantityChange, id]
  )
  return result.rows[0]
}
