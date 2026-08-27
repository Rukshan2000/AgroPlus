import { query, withTransaction } from "../lib/db"

// ============================================================================
// SUPPLIER QUERIES
// ============================================================================

export async function findSupplierById(id) {
  const result = await query(
    'SELECT * FROM suppliers WHERE id = $1 LIMIT 1',
    [id]
  )
  return result.rows[0] || null
}

export async function findSupplierByName(name) {
  const result = await query(
    'SELECT * FROM suppliers WHERE name = $1 LIMIT 1',
    [name]
  )
  return result.rows[0] || null
}

export async function findSupplierByEmail(email) {
  const result = await query(
    'SELECT * FROM suppliers WHERE email = $1 LIMIT 1',
    [email]
  )
  return result.rows[0] || null
}

export async function listSuppliers({ 
  page = 1, 
  limit = 10, 
  search, 
  is_active,
  supplier_type
} = {}) {
  const offset = (page - 1) * limit
  let whereConditions = []
  let params = []
  let paramIndex = 1

  if (search) {
    whereConditions.push(`(
      name ILIKE $${paramIndex} 
      OR contact_person ILIKE $${paramIndex} 
      OR email ILIKE $${paramIndex}
      OR phone ILIKE $${paramIndex}
      OR city ILIKE $${paramIndex}
    )`)
    params.push(`%${search}%`)
    paramIndex++
  }

  if (is_active !== undefined) {
    whereConditions.push(`is_active = $${paramIndex}`)
    params.push(is_active)
    paramIndex++
  }

  if (supplier_type) {
    whereConditions.push(`supplier_type = $${paramIndex}`)
    params.push(supplier_type)
    paramIndex++
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

  // Get total count
  const countResult = await query(`
    SELECT COUNT(*) as total
    FROM suppliers
    ${whereClause}
  `, params)

  // Get suppliers with purchase order count
  const result = await query(`
    SELECT 
      s.*,
      u.name as created_by_name,
      COUNT(DISTINCT po.id) as total_orders
    FROM suppliers s
    LEFT JOIN users u ON s.created_by = u.id
    LEFT JOIN purchase_orders po ON s.id = po.supplier_id
    ${whereClause}
    GROUP BY s.id, u.name
    ORDER BY s.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `, [...params, limit, offset])

  return {
    suppliers: result.rows,
    total: parseInt(countResult.rows[0].total),
    page,
    limit,
    totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
  }
}

export async function createSupplier({
  name,
  contact_person,
  email,
  phone,
  address,
  city,
  postal_code,
  country,
  payment_terms,
  payment_method,
  bank_account,
  bank_name,
  supplier_type,
  tax_id,
  is_active = true,
  rating = null,
  notes,
  created_by
}) {
  const result = await query(`
    INSERT INTO suppliers (
      name, contact_person, email, phone, address, city, postal_code, country,
      payment_terms, payment_method, bank_account, bank_name,
      supplier_type, tax_id, is_active, rating, notes, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING *
  `, [
    name, contact_person, email, phone, address, city, postal_code, country,
    payment_terms, payment_method, bank_account, bank_name,
    supplier_type, tax_id, is_active, rating, notes, created_by
  ])
  return result.rows[0]
}

export async function updateSupplier(id, updates) {
  const {
    name,
    contact_person,
    email,
    phone,
    address,
    city,
    postal_code,
    country,
    payment_terms,
    payment_method,
    bank_account,
    bank_name,
    supplier_type,
    tax_id,
    is_active,
    rating,
    notes
  } = updates

  // Build dynamic update query
  let setClauses = []
  let params = []
  let paramIndex = 1

  if (name !== undefined) {
    setClauses.push(`name = $${paramIndex++}`)
    params.push(name)
  }
  if (contact_person !== undefined) {
    setClauses.push(`contact_person = $${paramIndex++}`)
    params.push(contact_person)
  }
  if (email !== undefined) {
    setClauses.push(`email = $${paramIndex++}`)
    params.push(email)
  }
  if (phone !== undefined) {
    setClauses.push(`phone = $${paramIndex++}`)
    params.push(phone)
  }
  if (address !== undefined) {
    setClauses.push(`address = $${paramIndex++}`)
    params.push(address)
  }
  if (city !== undefined) {
    setClauses.push(`city = $${paramIndex++}`)
    params.push(city)
  }
  if (postal_code !== undefined) {
    setClauses.push(`postal_code = $${paramIndex++}`)
    params.push(postal_code)
  }
  if (country !== undefined) {
    setClauses.push(`country = $${paramIndex++}`)
    params.push(country)
  }
  if (payment_terms !== undefined) {
    setClauses.push(`payment_terms = $${paramIndex++}`)
    params.push(payment_terms)
  }
  if (payment_method !== undefined) {
    setClauses.push(`payment_method = $${paramIndex++}`)
    params.push(payment_method)
  }
  if (bank_account !== undefined) {
    setClauses.push(`bank_account = $${paramIndex++}`)
    params.push(bank_account)
  }
  if (bank_name !== undefined) {
    setClauses.push(`bank_name = $${paramIndex++}`)
    params.push(bank_name)
  }
  if (supplier_type !== undefined) {
    setClauses.push(`supplier_type = $${paramIndex++}`)
    params.push(supplier_type)
  }
  if (tax_id !== undefined) {
    setClauses.push(`tax_id = $${paramIndex++}`)
    params.push(tax_id)
  }
  if (is_active !== undefined) {
    setClauses.push(`is_active = $${paramIndex++}`)
    params.push(is_active)
  }
  if (rating !== undefined) {
    setClauses.push(`rating = $${paramIndex++}`)
    params.push(rating)
  }
  if (notes !== undefined) {
    setClauses.push(`notes = $${paramIndex++}`)
    params.push(notes)
  }

  setClauses.push(`updated_at = NOW()`)
  params.push(id)

  const result = await query(`
    UPDATE suppliers 
    SET ${setClauses.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `, params)

  return result.rows[0] || null
}

export async function deleteSupplier(id) {
  return await withTransaction(async (client) => {
    // Check if supplier has any pending purchase orders
    const poResult = await client.query(
      'SELECT COUNT(*) as count FROM purchase_orders WHERE supplier_id = $1 AND status IN (\'pending\', \'partial\')',
      [id]
    )
    
    if (parseInt(poResult.rows[0].count) > 0) {
      throw new Error('Cannot delete supplier with active purchase orders')
    }

    // Hard delete supplier
    const result = await client.query(
      'DELETE FROM suppliers WHERE id = $1 RETURNING *',
      [id]
    )
    return result.rows[0] || null
  })
}

export async function getSupplierStats(supplierId) {
  const result = await query(`
    SELECT 
      s.id,
      s.name,
      COUNT(DISTINCT po.id) as total_orders,
      SUM(po.total_amount) as total_spent,
      AVG(s.rating) as avg_rating,
      MAX(po.actual_delivery_date) as last_delivery_date,
      COUNT(DISTINCT CASE WHEN po.status = 'pending' THEN po.id END) as pending_orders,
      COUNT(DISTINCT CASE WHEN po.status = 'partial' THEN po.id END) as partial_orders
    FROM suppliers s
    LEFT JOIN purchase_orders po ON s.id = po.supplier_id
    WHERE s.id = $1
    GROUP BY s.id, s.name
  `, [supplierId])
  
  return result.rows[0] || null
}

export async function getSupplierProducts(supplierId) {
  const result = await query(`
    SELECT DISTINCT
      p.id,
      p.name,
      p.sku,
      sp.unit_cost,
      sp.minimum_order_quantity,
      sp.unit_type,
      sp.is_active
    FROM supplier_prices sp
    JOIN products p ON sp.product_id = p.id
    WHERE sp.supplier_id = $1 AND sp.is_active = true
    ORDER BY p.name
  `, [supplierId])
  
  return result.rows
}
