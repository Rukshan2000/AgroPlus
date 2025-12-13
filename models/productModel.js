import { query } from "../lib/db"
import { bulkCreatePriceVariations } from "./priceVariationModel"

// ============================================================================
// CONSTANTS & UTILITIES
// ============================================================================

export const UNIT_TYPES = [
  // Weight
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'mg', label: 'Milligrams (mg)' },
  { value: 'ton', label: 'Tons (ton)' },
  { value: 'lb', label: 'Pounds (lb)' },
  { value: 'oz', label: 'Ounces (oz)' },
  
  // Volume
  { value: 'l', label: 'Liters (l)' },
  { value: 'ml', label: 'Milliliters (ml)' },
  { value: 'gal', label: 'Gallons (gal)' },
  { value: 'pt', label: 'Pints (pt)' },
  { value: 'qt', label: 'Quarts (qt)' },
  
  // Length / Area / Dimension
  { value: 'm', label: 'Meters (m)' },
  { value: 'cm', label: 'Centimeters (cm)' },
  { value: 'mm', label: 'Millimeters (mm)' },
  { value: 'ft', label: 'Feet (ft)' },
  { value: 'in', label: 'Inches (in)' },
  { value: 'sqft', label: 'Square Feet (sqft)' },
  { value: 'sqm', label: 'Square Meters (sqm)' },
  
  // Count / Quantity
  { value: 'items', label: 'Items' },
  { value: 'pcs', label: 'Pieces' },
  { value: 'units', label: 'Units' },
  { value: 'packs', label: 'Packs' },
  { value: 'boxes', label: 'Boxes' },
  { value: 'bottles', label: 'Bottles' },
  { value: 'bags', label: 'Bags' },
  { value: 'sachets', label: 'Sachets' },
  { value: 'cartons', label: 'Cartons' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'pair', label: 'Pair' },
  { value: 'rolls', label: 'Rolls' },
  { value: 'barrels', label: 'Barrels' },
  { value: 'drums', label: 'Drums' },
  { value: 'packets', label: 'Packets' },
  { value: 'trays', label: 'Trays' },
  { value: 'containers', label: 'Containers' },
  { value: 'sheets', label: 'Sheets' },
  { value: 'tubes', label: 'Tubes' },
  { value: 'bundles', label: 'Bundles' },
  
  // Agricultural / Misc
  { value: 'bunch', label: 'Bunch' },
  { value: 'litre', label: 'Litre (litre)' },
  { value: 'acre', label: 'Acre' },
  { value: 'hectare', label: 'Hectare' },
  { value: 'plant', label: 'Plant' },
  { value: 'seed', label: 'Seed' },
  { value: 'sack', label: 'Sack' },
  { value: 'crate', label: 'Crate' },
]

// ============================================================================
// PRIVATE HELPER FUNCTIONS
// ============================================================================

/**
 * Builds WHERE clause for filtered queries
 * @param {Object} filters - Filter criteria
 * @param {Array} params - Parameters array (passed by reference)
 * @returns {Object} SQL clause and updated params
 */
function buildWhereClause(filters = {}, params = []) {
  const conditions = []
  let paramIndex = params.length + 1
  
  if (filters.category) {
    conditions.push(`category = $${paramIndex}`)
    params.push(filters.category)
    paramIndex++
  }
  
  if (filters.search) {
    conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR sku ILIKE $${paramIndex})`)
    params.push(`%${filters.search}%`)
    paramIndex++
  }
  
  if (filters.is_active !== undefined) {
    conditions.push(`is_active = $${paramIndex}`)
    params.push(filters.is_active)
    paramIndex++
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  
  return { whereClause, params }
}

/**
 * Determines selling price with backward compatibility
 */
function determineSellingPrice(price, sellingPrice) {
  return sellingPrice || price || 0.00
}

// ============================================================================
// PRODUCT CRUD OPERATIONS
// ============================================================================

export async function findProductById(id) {
  const result = await query(
    'SELECT * FROM products WHERE id = $1 LIMIT 1',
    [id]
  )
  return result.rows[0] || null
}

export async function findProductBySku(sku) {
  const result = await query(
    'SELECT * FROM products WHERE sku = $1 LIMIT 1', 
    [sku]
  )
  return result.rows[0] || null
}

export async function createProduct(productData) {
  const {
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
  } = productData
  
  const finalSellingPrice = determineSellingPrice(price, selling_price)
  
  const result = await query(`
    INSERT INTO products (
      name, description, price, buying_price, selling_price, sku, category, 
      stock_quantity, available_quantity, is_active, image_url, created_by, 
      unit_type, unit_value, expiry_date, manufacture_date, alert_before_days, 
      minimum_quantity
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING *
  `, [
    name, description, finalSellingPrice, buying_price, finalSellingPrice, 
    sku, category, stock_quantity, stock_quantity, is_active, image_url, created_by, 
    unit_type, unit_value, expiry_date, manufacture_date, alert_before_days, 
    minimum_quantity
  ]);
  
  return result.rows[0]
}

export async function listProducts({
  page = 1,
  limit = 10,
  category,
  search,
  is_active
} = {}) {
  
  const offset = (page - 1) * limit
  const params = []
  
  const { whereClause, params: whereParams } = buildWhereClause(
    { category, search, is_active },
    params
  )
  
  // Get total count
  const countResult = await query(`
    SELECT COUNT(*) as total
    FROM products
    ${whereClause}
  `, whereParams)
  
  // Get products with creator info
  const result = await query(`
    SELECT p.*, u.name as created_by_name
    FROM products p
    LEFT JOIN users u ON p.created_by = u.id
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT $${whereParams.length + 1} OFFSET $${whereParams.length + 2}
  `, [...whereParams, limit, offset])
  
  const total = parseInt(countResult.rows[0].total)
  
  return {
    products: result.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

export async function updateProduct(id, updateData) {
  const {
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
  } = updateData
  
  const finalSellingPrice = determineSellingPrice(price, selling_price)
  
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
    name, description, finalSellingPrice, buying_price, finalSellingPrice, 
    sku, category, stock_quantity, is_active, image_url, unit_type, unit_value,
    expiry_date, manufacture_date, alert_before_days, minimum_quantity, id
  ])
  
  return result.rows[0] || null
}

export async function deleteProduct(id) {
  const result = await query(
    'DELETE FROM products WHERE id = $1 RETURNING *', 
    [id]
  )
  return result.rows[0] || null
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

export async function bulkDeleteProducts(ids) {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return { deleted: [], failed: [] }
  }
  
  const results = {
    deleted: [],
    failed: []
  }
  
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

export async function bulkCreateProducts(products, created_by) {
  const results = {
    success: [],
    failed: []
  }
  
  for (const product of products) {
    try {
      // Validate SKU uniqueness
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
      
      // Extract price variations
      const priceVariations = product.price_variations || []
      delete product.price_variations
      
      // Create product
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

// ============================================================================
// INVENTORY MANAGEMENT
// ============================================================================

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

export async function restockProduct({
  product_id,
  quantity_added,
  expiry_date = null,
  manufacture_date = null,
  notes = null,
  restocked_by
}) {
  try {
    // Get current product info
    const productResult = await query(
      'SELECT stock_quantity, available_quantity FROM products WHERE id = $1',
      [product_id]
    )
    
    if (productResult.rows.length === 0) {
      throw new Error('Product not found')
    }
    
    const currentProduct = productResult.rows[0]
    const previous_stock = currentProduct.stock_quantity
    const new_stock = previous_stock + quantity_added
    
    // Build update query
    const updateFields = [
      'stock_quantity = stock_quantity + $1',
      'available_quantity = available_quantity + $1',
      'updated_at = NOW()'
    ]
    const updateParams = [quantity_added]
    let paramIndex = 2
    
    // Add optional date updates
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
    
    // Update product
    const updateQuery = `
      UPDATE products SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `
    updateParams.push(product_id)
    
    const updatedProduct = await query(updateQuery, updateParams)
    
    // Record restock history
    await query(`
      INSERT INTO restock_history (
        product_id, quantity_added, previous_stock, new_stock, 
        expiry_date, manufacture_date, notes, restocked_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      product_id, quantity_added, previous_stock, new_stock,
      expiry_date, manufacture_date, notes, restocked_by
    ])
    
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
    console.error('Restock error:', error)
    throw error
  }
}

// ============================================================================
// QUERY & REPORTING
// ============================================================================

export async function getProductsLowStock(threshold = 10) {
  const result = await query(`
    SELECT * FROM products 
    WHERE available_quantity <= $1 AND is_active = true
    ORDER BY available_quantity ASC
  `, [threshold])
  
  return result.rows
}

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
  
  // Group variations by product
  const variationsByProduct = {}
  variations.forEach(v => {
    if (!variationsByProduct[v.product_id]) {
      variationsByProduct[v.product_id] = []
    }
    variationsByProduct[v.product_id].push(v)
  })
  
  // Combine products with variations
  return result.rows.map(product => ({
    ...product,
    price_variations: variationsByProduct[product.id] || []
  }))
}

// ============================================================================
// EXPIRY MANAGEMENT
// ============================================================================

export async function updateProductExpiry(id, updateData) {
  const {
    expiry_date,
    manufacture_date,
    alert_before_days,
    minimum_quantity
  } = updateData
  
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

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export function getAvailableUnits() {
  return UNIT_TYPES
}