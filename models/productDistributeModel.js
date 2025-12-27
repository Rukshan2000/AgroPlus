import { query } from "../lib/db"

// ============================================================================
// PRODUCT DISTRIBUTE - CRUD OPERATIONS
// ============================================================================

/**
 * Create a new product distribution record
 * @param {Object} data - Distribution data
 * @returns {Object} Created distribution record
 */
export async function createDistribution({
  product_id,
  outlet_id,
  quantity_distributed,
  distributed_by,
  notes = null
}) {
  const result = await query(`
    INSERT INTO product_distribute 
    (product_id, outlet_id, quantity_distributed, distributed_by, notes)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [product_id, outlet_id, quantity_distributed, distributed_by, notes])
  
  return result.rows[0] || null
}

/**
 * Get all distributions with pagination and filtering
 * @param {Object} options - Query options
 * @returns {Object} Distributions array and total count
 */
export async function listDistributions({
  page = 1,
  limit = 10,
  product_id = null,
  outlet_id = null,
  start_date = null,
  end_date = null
} = {}) {
  const offset = (page - 1) * limit
  let whereConditions = []
  let params = []
  let paramIndex = 1

  if (product_id) {
    whereConditions.push(`pd.product_id = $${paramIndex}`)
    params.push(product_id)
    paramIndex++
  }

  if (outlet_id) {
    whereConditions.push(`pd.outlet_id = $${paramIndex}`)
    params.push(outlet_id)
    paramIndex++
  }

  if (start_date) {
    whereConditions.push(`pd.distribution_date >= $${paramIndex}`)
    params.push(start_date)
    paramIndex++
  }

  if (end_date) {
    whereConditions.push(`pd.distribution_date <= $${paramIndex}`)
    params.push(end_date)
    paramIndex++
  }

  whereConditions.push(`pd.is_active = true`)

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : 'WHERE pd.is_active = true'

  // Get total count
  const countResult = await query(`
    SELECT COUNT(*) as total FROM product_distribute pd
    ${whereClause}
  `, params)

  const total = parseInt(countResult.rows[0]?.total || 0)

  // Get paginated results with product and outlet details
  const result = await query(`
    SELECT 
      pd.id,
      pd.product_id,
      p.name as product_name,
      p.sku,
      pd.outlet_id,
      o.name as outlet_name,
      pd.quantity_distributed,
      pd.distributed_by,
      pd.distribution_date,
      pd.notes,
      pd.is_active,
      pd.created_at,
      pd.updated_at
    FROM product_distribute pd
    JOIN products p ON pd.product_id = p.id
    JOIN outlets o ON pd.outlet_id = o.id
    ${whereClause}
    ORDER BY pd.distribution_date DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `, [...params, limit, offset])

  return {
    distributions: result.rows,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit)
  }
}

/**
 * Get a single distribution record by ID
 * @param {number} id - Distribution ID
 * @returns {Object} Distribution record with product and outlet details
 */
export async function findDistributionById(id) {
  const result = await query(`
    SELECT 
      pd.id,
      pd.product_id,
      p.name as product_name,
      p.sku,
      pd.outlet_id,
      o.name as outlet_name,
      pd.quantity_distributed,
      pd.distributed_by,
      pd.distribution_date,
      pd.notes,
      pd.is_active,
      pd.created_at,
      pd.updated_at
    FROM product_distribute pd
    JOIN products p ON pd.product_id = p.id
    JOIN outlets o ON pd.outlet_id = o.id
    WHERE pd.id = $1
    LIMIT 1
  `, [id])

  return result.rows[0] || null
}

/**
 * Get distributions for a specific product
 * @param {number} product_id - Product ID
 * @param {Object} options - Query options
 * @returns {Array} Distribution records
 */
export async function findDistributionsByProduct(product_id, options = {}) {
  const { outlet_id = null, start_date = null, end_date = null } = options
  
  let whereConditions = ['pd.product_id = $1', 'pd.is_active = true']
  let params = [product_id]
  let paramIndex = 2

  if (outlet_id) {
    whereConditions.push(`pd.outlet_id = $${paramIndex}`)
    params.push(outlet_id)
    paramIndex++
  }

  if (start_date) {
    whereConditions.push(`pd.distribution_date >= $${paramIndex}`)
    params.push(start_date)
    paramIndex++
  }

  if (end_date) {
    whereConditions.push(`pd.distribution_date <= $${paramIndex}`)
    params.push(end_date)
    paramIndex++
  }

  const whereClause = whereConditions.join(' AND ')

  const result = await query(`
    SELECT 
      pd.id,
      pd.product_id,
      pd.outlet_id,
      o.name as outlet_name,
      pd.quantity_distributed,
      pd.distributed_by,
      pd.distribution_date,
      pd.notes,
      pd.created_at
    FROM product_distribute pd
    JOIN outlets o ON pd.outlet_id = o.id
    WHERE ${whereClause}
    ORDER BY pd.distribution_date DESC
  `, params)

  return result.rows
}

/**
 * Get distributions for a specific outlet
 * @param {number} outlet_id - Outlet ID
 * @param {Object} options - Query options
 * @returns {Array} Distribution records
 */
export async function findDistributionsByOutlet(outlet_id, options = {}) {
  const { product_id = null, start_date = null, end_date = null } = options
  
  let whereConditions = ['pd.outlet_id = $1', 'pd.is_active = true']
  let params = [outlet_id]
  let paramIndex = 2

  if (product_id) {
    whereConditions.push(`pd.product_id = $${paramIndex}`)
    params.push(product_id)
    paramIndex++
  }

  if (start_date) {
    whereConditions.push(`pd.distribution_date >= $${paramIndex}`)
    params.push(start_date)
    paramIndex++
  }

  if (end_date) {
    whereConditions.push(`pd.distribution_date <= $${paramIndex}`)
    params.push(end_date)
    paramIndex++
  }

  const whereClause = whereConditions.join(' AND ')

  const result = await query(`
    SELECT 
      pd.id,
      pd.product_id,
      p.name as product_name,
      p.sku,
      pd.outlet_id,
      pd.quantity_distributed,
      pd.distributed_by,
      pd.distribution_date,
      pd.notes,
      pd.created_at
    FROM product_distribute pd
    JOIN products p ON pd.product_id = p.id
    WHERE ${whereClause}
    ORDER BY pd.distribution_date DESC
  `, params)

  return result.rows
}

/**
 * Update a distribution record
 * @param {number} id - Distribution ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated distribution record
 */
export async function updateDistribution(id, updateData) {
  const allowed = ['quantity_distributed', 'notes', 'is_active']
  const updates = []
  const params = []
  let paramIndex = 1

  Object.keys(updateData).forEach(key => {
    if (allowed.includes(key)) {
      updates.push(`${key} = $${paramIndex}`)
      params.push(updateData[key])
      paramIndex++
    }
  })

  if (updates.length === 0) return null

  updates.push(`updated_at = CURRENT_TIMESTAMP`)
  params.push(id)

  const result = await query(`
    UPDATE product_distribute
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `, params)

  return result.rows[0] || null
}

/**
 * Delete/deactivate a distribution record
 * @param {number} id - Distribution ID
 * @returns {boolean} Success status
 */
export async function deleteDistribution(id) {
  const result = await query(`
    UPDATE product_distribute
    SET is_active = false, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id
  `, [id])

  return result.rows.length > 0
}

/**
 * Get total quantity distributed for a product to all outlets
 * @param {number} product_id - Product ID
 * @returns {Object} Total distributed quantity by outlet
 */
export async function getTotalDistributedByProduct(product_id) {
  const result = await query(`
    SELECT 
      o.id as outlet_id,
      o.name as outlet_name,
      SUM(pd.quantity_distributed) as total_quantity,
      COUNT(*) as distribution_count,
      MAX(pd.distribution_date) as last_distribution
    FROM product_distribute pd
    JOIN outlets o ON pd.outlet_id = o.id
    WHERE pd.product_id = $1 AND pd.is_active = true
    GROUP BY o.id, o.name
    ORDER BY total_quantity DESC
  `, [product_id])

  return result.rows
}

/**
 * Get total quantity distributed to an outlet from all products
 * @param {number} outlet_id - Outlet ID
 * @returns {Object} Total distributed quantity by product
 */
export async function getTotalDistributedByOutlet(outlet_id) {
  const result = await query(`
    SELECT 
      p.id as product_id,
      p.name as product_name,
      p.sku,
      SUM(pd.quantity_distributed) as total_quantity,
      COUNT(*) as distribution_count,
      MAX(pd.distribution_date) as last_distribution
    FROM product_distribute pd
    JOIN products p ON pd.product_id = p.id
    WHERE pd.outlet_id = $1 AND pd.is_active = true
    GROUP BY p.id, p.name, p.sku
    ORDER BY total_quantity DESC
  `, [outlet_id])

  return result.rows
}

/**
 * Get distribution statistics for a date range
 * @param {string} start_date - Start date
 * @param {string} end_date - End date
 * @returns {Object} Distribution statistics
 */
export async function getDistributionStats(start_date, end_date) {
  const result = await query(`
    SELECT 
      COUNT(*) as total_distributions,
      SUM(pd.quantity_distributed) as total_quantity,
      AVG(pd.quantity_distributed) as avg_quantity,
      COUNT(DISTINCT pd.product_id) as unique_products,
      COUNT(DISTINCT pd.outlet_id) as unique_outlets,
      COUNT(DISTINCT pd.distributed_by) as unique_distributors
    FROM product_distribute pd
    WHERE pd.distribution_date BETWEEN $1 AND $2
      AND pd.is_active = true
  `, [start_date, end_date])

  return result.rows[0] || {}
}

/**
 * Bulk create distribution records
 * @param {Array} distributions - Array of distribution objects
 * @returns {Array} Created records
 */
export async function bulkCreateDistributions(distributions) {
  if (!distributions || distributions.length === 0) return []

  let query_str = `
    INSERT INTO product_distribute 
    (product_id, outlet_id, quantity_distributed, distributed_by, notes)
    VALUES 
  `
  const params = []
  let paramIndex = 1

  distributions.forEach((dist, index) => {
    if (index > 0) query_str += ', '
    query_str += `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4})`
    params.push(dist.product_id, dist.outlet_id, dist.quantity_distributed, dist.distributed_by, dist.notes || null)
    paramIndex += 5
  })

  query_str += ` RETURNING *`

  const result = await query(query_str, params)
  return result.rows
}
