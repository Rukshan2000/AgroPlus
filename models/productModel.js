import { query } from "../lib/db"
import { bulkCreatePriceVariations } from "./priceVariationModel"

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
  unit_value = 1.000,
  expiry_date = null,
  manufacture_date = null,
  alert_before_days = 7,
  minimum_quantity = 5
}) {
  // Use selling_price if provided, otherwise fall back to price for backward compatibility
  const finalSellingPrice = selling_price || price || 0.00;
  
  const result = await query(`
    INSERT INTO products (
      name, description, price, buying_price, selling_price, sku, category, 
      stock_quantity, available_quantity, is_active, image_url, created_by, unit_type, unit_value,
      expiry_date, manufacture_date, alert_before_days, minimum_quantity
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *
  `, [
    name, description, finalSellingPrice, buying_price, finalSellingPrice, sku, category, 
    stock_quantity, is_active, image_url, created_by, unit_type, unit_value,
    expiry_date, manufacture_date, alert_before_days, minimum_quantity
  ])
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
  unit_value,
  expiry_date,
  manufacture_date,
  alert_before_days,
  minimum_quantity
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
      expiry_date = $13,
      manufacture_date = $14,
      alert_before_days = $15,
      minimum_quantity = $16,
      updated_at = NOW()
    WHERE id = $17
    RETURNING *
  `, [
    name, description, finalSellingPrice, buying_price, finalSellingPrice, sku, category, 
    stock_quantity, is_active, image_url, unit_type, unit_value,
    expiry_date, manufacture_date, alert_before_days, minimum_quantity, id
  ])
  return result.rows[0] || null
}

export async function deleteProduct(id) {
  const result = await query('DELETE FROM products WHERE id = $1 RETURNING *', [id])
  return result.rows[0] || null
}

export async function bulkDeleteProducts(ids) {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return { deleted: [], failed: [] }
  }

  const results = {
    deleted: [],
    failed: []
  }

  // Delete products one by one to handle any constraints
  for (const id of ids) {
    try {
      const deleted = await deleteProduct(id)
      if (deleted) {
        results.deleted.push(deleted)
      } else {
        results.failed.push({ id, error: 'Product not found' })
      }
    } catch (error) {
      results.failed.push({ id, error: error.message })
    }
  }

  return results
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

// Restock product function
export async function restockProduct({
  product_id,
  quantity_added,
  expiry_date = null,
  manufacture_date = null,
  notes = null,
  restocked_by
}) {
  try {
    console.log('Restock function called with:', {
      product_id,
      quantity_added,
      expiry_date,
      manufacture_date,
      notes,
      restocked_by
    })

    // Get current product info
    const productResult = await query(
      'SELECT stock_quantity, available_quantity FROM products WHERE id = $1',
      [product_id]
    )
    
    console.log('Product query result:', productResult.rows)
    
    if (productResult.rows.length === 0) {
      throw new Error('Product not found')
    }
    
    const currentProduct = productResult.rows[0]
    const previous_stock = currentProduct.stock_quantity
    const new_stock = previous_stock + quantity_added
    
    console.log('Stock calculation:', { previous_stock, quantity_added, new_stock })
    
    // Update product stock
    const updateFields = [
      'stock_quantity = stock_quantity + $1',
      'available_quantity = available_quantity + $1',
      'updated_at = NOW()'
    ]
    const updateParams = [quantity_added]
    let paramIndex = 2
    
    // Update expiry and manufacture dates if provided
    if (expiry_date) {
      updateFields.push(`expiry_date = $${paramIndex}`)
      updateParams.push(expiry_date)
      paramIndex++
    }
    
    if (manufacture_date) {
      updateFields.push(`manufacture_date = $${paramIndex}`)
      updateParams.push(manufacture_date)
      paramIndex++
    }
    
    const updateQuery = `
      UPDATE products SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `
    updateParams.push(product_id)
    
    console.log('Update query:', updateQuery)
    console.log('Update params:', updateParams)
    
    const updatedProduct = await query(updateQuery, updateParams)
    
    console.log('Product updated successfully')
    
    // Record restock history
    const historyInsert = await query(`
      INSERT INTO restock_history (
        product_id, quantity_added, previous_stock, new_stock, 
        expiry_date, manufacture_date, notes, restocked_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      product_id, quantity_added, previous_stock, new_stock,
      expiry_date, manufacture_date, notes, restocked_by
    ])
    
    console.log('Restock history recorded successfully')
    
    return {
      success: true,
      product: updatedProduct.rows[0],
      restock_info: {
        quantity_added,
        previous_stock,
        new_stock
      }
    }
  } catch (error) {
    console.error('Restock error details:', error)
    throw error
  }
}

// Get restock history for a product
export async function getRestockHistory(product_id, limit = 50) {
  const result = await query(`
    SELECT 
      rh.*,
      u.name as restocked_by_name
    FROM restock_history rh
    LEFT JOIN users u ON rh.restocked_by = u.id
    WHERE rh.product_id = $1
    ORDER BY rh.restocked_at DESC
    LIMIT $2
  `, [product_id, limit])
  
  return result.rows
}

// Get products expiring soon
export async function getProductsExpiringSoon(days_ahead = 7) {
  const result = await query(`
    SELECT 
      p.*,
      CASE 
        WHEN p.expiry_date <= CURRENT_DATE THEN 'expired'
        WHEN p.expiry_date <= CURRENT_DATE + INTERVAL '${days_ahead} days' THEN 'expiring_soon'
        ELSE 'safe'
      END as expiry_status,
      (p.expiry_date - CURRENT_DATE) as days_until_expiry
    FROM products p
    WHERE p.is_active = true 
      AND p.expiry_date IS NOT NULL
      AND p.expiry_date <= CURRENT_DATE + INTERVAL '${days_ahead} days'
    ORDER BY p.expiry_date ASC
  `)
  
  return result.rows
}

// Get products with custom alert timing
export async function getProductsWithAlerts() {
  const result = await query(`
    SELECT 
      p.*,
      CASE 
        WHEN p.expiry_date <= CURRENT_DATE THEN 'expired'
        WHEN p.expiry_date <= CURRENT_DATE + INTERVAL '1 day' * p.alert_before_days THEN 'expiring_soon'
        ELSE 'safe'
      END as expiry_status,
      (p.expiry_date - CURRENT_DATE) as days_until_expiry,
      CASE 
        WHEN p.available_quantity <= p.minimum_quantity THEN 'low_stock'
        ELSE 'sufficient'
      END as stock_status
    FROM products p
    WHERE p.is_active = true 
      AND (
        (p.expiry_date IS NOT NULL AND p.expiry_date <= CURRENT_DATE + INTERVAL '1 day' * p.alert_before_days)
        OR p.available_quantity <= p.minimum_quantity
      )
    ORDER BY 
      CASE WHEN p.expiry_date <= CURRENT_DATE THEN 0 ELSE 1 END,
      p.expiry_date ASC,
      p.available_quantity ASC
  `)
  
  return result.rows
}

// Update product with expiry information
export async function updateProductExpiry(id, {
  expiry_date,
  manufacture_date,
  alert_before_days,
  minimum_quantity
}) {
  const fields = []
  const params = []
  let paramIndex = 1
  
  if (expiry_date !== undefined) {
    fields.push(`expiry_date = $${paramIndex}`)
    params.push(expiry_date)
    paramIndex++
  }
  
  if (manufacture_date !== undefined) {
    fields.push(`manufacture_date = $${paramIndex}`)
    params.push(manufacture_date)
    paramIndex++
  }
  
  if (alert_before_days !== undefined) {
    fields.push(`alert_before_days = $${paramIndex}`)
    params.push(alert_before_days)
    paramIndex++
  }
  
  if (minimum_quantity !== undefined) {
    fields.push(`minimum_quantity = $${paramIndex}`)
    params.push(minimum_quantity)
    paramIndex++
  }
  
  if (fields.length === 0) {
    throw new Error('No fields to update')
  }
  
  fields.push('updated_at = NOW()')
  params.push(id)
  
  const result = await query(`
    UPDATE products 
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `, params)
  
  return result.rows[0] || null
}

// Bulk create products
export async function bulkCreateProducts(products, created_by) {
  const results = {
    success: [],
    failed: []
  }

  for (const product of products) {
    try {
      // Check if SKU exists
      if (product.sku) {
        const existing = await findProductBySku(product.sku)
        if (existing) {
          results.failed.push({
            product,
            error: `SKU ${product.sku} already exists`
          })
          continue
        }
      }

      // Extract price variations if they exist
      const priceVariations = product.price_variations || []
      delete product.price_variations

      const created = await createProduct({
        ...product,
        created_by
      })
      
      // Create price variations if provided
      if (priceVariations.length > 0) {
        await bulkCreatePriceVariations(created.id, priceVariations, created_by)
      }
      
      results.success.push(created)
    } catch (error) {
      results.failed.push({
        product,
        error: error.message
      })
    }
  }

  return results
}

// Get all products for export
export async function getAllProductsForExport() {
  const result = await query(`
    SELECT 
      p.id,
      p.name,
      p.description,
      p.sku,
      p.category,
      p.buying_price,
      p.selling_price,
      p.price,
      p.stock_quantity,
      p.unit_type,
      p.unit_value,
      p.minimum_quantity,
      p.alert_before_days,
      p.expiry_date,
      p.manufacture_date,
      p.is_active,
      p.image_url
    FROM products p
    ORDER BY p.name ASC
  `)
  
  // Get price variations for all products
  const productIds = result.rows.map(p => p.id)
  let variations = []
  
  if (productIds.length > 0) {
    const variationsResult = await query(`
      SELECT 
        product_id,
        variant_name,
        price,
        buying_price,
        is_default,
        is_active,
        stock_quantity,
        sku_suffix,
        description,
        sort_order
      FROM product_price_variations
      WHERE product_id = ANY($1)
      ORDER BY product_id, sort_order ASC, is_default DESC
    `, [productIds])
    variations = variationsResult.rows
  }
  
  // Group variations by product_id
  const variationsByProduct = {}
  variations.forEach(v => {
    if (!variationsByProduct[v.product_id]) {
      variationsByProduct[v.product_id] = []
    }
    variationsByProduct[v.product_id].push(v)
  })
  
  // Add variations to products
  const productsWithVariations = result.rows.map(product => ({
    ...product,
    price_variations: variationsByProduct[product.id] || []
  }))
  
  return productsWithVariations
}
