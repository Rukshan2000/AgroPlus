import { query, withTransaction } from "../lib/db"

// ============================================================================
// PURCHASE ORDER QUERIES
// ============================================================================

export async function findPurchaseOrderById(id) {
  const result = await query(
    'SELECT * FROM purchase_orders WHERE id = $1 LIMIT 1',
    [id]
  )
  return result.rows[0] || null
}

export async function findPurchaseOrderByNumber(orderNumber) {
  const result = await query(
    'SELECT * FROM purchase_orders WHERE order_number = $1 LIMIT 1',
    [orderNumber]
  )
  return result.rows[0] || null
}

export async function listPurchaseOrders({
  page = 1,
  limit = 10,
  search,
  status,
  supplier_id,
  from_date,
  to_date
} = {}) {
  const offset = (page - 1) * limit
  let whereConditions = []
  let params = []
  let paramIndex = 1

  if (search) {
    whereConditions.push(`(
      po.order_number ILIKE $${paramIndex}
      OR s.name ILIKE $${paramIndex}
    )`)
    params.push(`%${search}%`)
    paramIndex++
  }

  if (status) {
    whereConditions.push(`po.status = $${paramIndex}`)
    params.push(status)
    paramIndex++
  }

  if (supplier_id) {
    whereConditions.push(`po.supplier_id = $${paramIndex}`)
    params.push(supplier_id)
    paramIndex++
  }

  if (from_date) {
    whereConditions.push(`po.order_date >= $${paramIndex}`)
    params.push(from_date)
    paramIndex++
  }

  if (to_date) {
    whereConditions.push(`po.order_date <= $${paramIndex}`)
    params.push(to_date)
    paramIndex++
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

  // Get total count
  const countResult = await query(`
    SELECT COUNT(*) as total
    FROM purchase_orders po
    JOIN suppliers s ON po.supplier_id = s.id
    ${whereClause}
  `, params)

  // Get purchase orders
  const result = await query(`
    SELECT 
      po.*,
      s.name as supplier_name,
      u.name as created_by_name,
      COUNT(DISTINCT poi.id) as item_count,
      SUM(poi.quantity_received) as total_quantity_received
    FROM purchase_orders po
    JOIN suppliers s ON po.supplier_id = s.id
    LEFT JOIN users u ON po.created_by = u.id
    LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
    ${whereClause}
    GROUP BY po.id, s.name, u.name
    ORDER BY po.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `, [...params, limit, offset])

  return {
    purchase_orders: result.rows,
    total: parseInt(countResult.rows[0].total),
    page,
    limit,
    totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
  }
}

export async function createPurchaseOrder({
  order_number,
  supplier_id,
  order_date,
  expected_delivery_date,
  items,
  notes,
  created_by
}) {
  return await withTransaction(async (client) => {
    // Verify supplier exists
    const supplierResult = await client.query(
      'SELECT id FROM suppliers WHERE id = $1',
      [supplier_id]
    )
    if (supplierResult.rows.length === 0) {
      throw new Error('Supplier not found')
    }

    // Create purchase order
    const poResult = await client.query(`
      INSERT INTO purchase_orders (
        order_number, supplier_id, order_date, expected_delivery_date, notes, created_by, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING *
    `, [order_number, supplier_id, order_date, expected_delivery_date, notes, created_by])

    const purchaseOrder = poResult.rows[0]

    // Calculate total and add items
    let totalAmount = 0
    for (const item of items) {
      const productResult = await client.query(
        'SELECT name, sku, unit_type FROM products WHERE id = $1',
        [item.product_id]
      )

      if (productResult.rows.length === 0) {
        throw new Error(`Product ${item.product_id} not found`)
      }

      const product = productResult.rows[0]
      const lineTotal = item.quantity_ordered * item.unit_cost

      await client.query(`
        INSERT INTO purchase_order_items (
          purchase_order_id, product_id, quantity_ordered, unit_cost, line_total,
          product_name, product_sku, unit_type
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        purchaseOrder.id,
        item.product_id,
        item.quantity_ordered,
        item.unit_cost,
        lineTotal,
        product.name,
        product.sku,
        product.unit_type
      ])

      totalAmount += lineTotal
    }

    // Update total amount
    await client.query(
      'UPDATE purchase_orders SET total_amount = $1 WHERE id = $2',
      [totalAmount, purchaseOrder.id]
    )

    return {
      ...purchaseOrder,
      total_amount: totalAmount,
      items: items.length
    }
  })
}

export async function updatePurchaseOrder(id, updates) {
  const { expected_delivery_date, notes } = updates

  let setClauses = []
  let params = []
  let paramIndex = 1

  if (expected_delivery_date !== undefined) {
    setClauses.push(`expected_delivery_date = $${paramIndex++}`)
    params.push(expected_delivery_date)
  }
  if (notes !== undefined) {
    setClauses.push(`notes = $${paramIndex++}`)
    params.push(notes)
  }

  if (setClauses.length === 0) {
    return await findPurchaseOrderById(id)
  }

  setClauses.push(`updated_at = NOW()`)
  params.push(id)

  const result = await query(`
    UPDATE purchase_orders
    SET ${setClauses.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `, params)

  return result.rows[0] || null
}

export async function receivePurchaseOrder(purchaseOrderId, itemUpdates) {
  return await withTransaction(async (client) => {
    // Verify PO exists and is not cancelled
    const poResult = await client.query(
      'SELECT * FROM purchase_orders WHERE id = $1',
      [purchaseOrderId]
    )

    if (poResult.rows.length === 0) {
      throw new Error('Purchase order not found')
    }

    const po = poResult.rows[0]
    if (po.status === 'cancelled') {
      throw new Error('Cannot receive cancelled purchase order')
    }

    // Update each item and corresponding product stock
    let hasPartialReceive = false
    let hasFullReceive = false

    for (const update of itemUpdates) {
      // Get item details
      const itemResult = await client.query(
        'SELECT * FROM purchase_order_items WHERE id = $1 AND purchase_order_id = $2',
        [update.id, purchaseOrderId]
      )

      if (itemResult.rows.length === 0) {
        throw new Error(`Purchase order item ${update.id} not found`)
      }

      const item = itemResult.rows[0]
      const remainingToReceive = item.quantity_ordered - item.quantity_received - item.quantity_cancelled

      if (update.quantity_received > remainingToReceive) {
        throw new Error(`Cannot receive more than ordered for item ${update.id}`)
      }

      // Update item
      const newQuantityReceived = item.quantity_received + update.quantity_received
      await client.query(`
        UPDATE purchase_order_items
        SET quantity_received = $1, updated_at = NOW()
        WHERE id = $2
      `, [newQuantityReceived, update.id])

      // Update product stock and buying price
      await client.query(`
        UPDATE products
        SET 
          stock_quantity = stock_quantity + $1,
          buying_price = $2,
          updated_at = NOW()
        WHERE id = $3
      `, [update.quantity_received, item.unit_cost, item.product_id])

      // Track receive status
      if (newQuantityReceived < item.quantity_ordered) {
        hasPartialReceive = true
      } else {
        hasFullReceive = true
      }
    }

    // Update PO status
    const allItemsResult = await client.query(`
      SELECT 
        COUNT(*) as total_items,
        SUM(CASE WHEN quantity_received >= quantity_ordered - quantity_cancelled THEN 1 ELSE 0 END) as completed_items
      FROM purchase_order_items
      WHERE purchase_order_id = $1
    `, [purchaseOrderId])

    const stats = allItemsResult.rows[0]
    const allCompleted = parseInt(stats.total_items) === parseInt(stats.completed_items)

    const newStatus = allCompleted ? 'received' : 'partial'
    await client.query(
      'UPDATE purchase_orders SET status = $1, actual_delivery_date = CURRENT_DATE, updated_at = NOW() WHERE id = $2',
      [newStatus, purchaseOrderId]
    )

    return {
      purchase_order_id: purchaseOrderId,
      new_status: newStatus,
      message: `Purchase order marked as ${newStatus}`
    }
  })
}

export async function cancelPurchaseOrder(id) {
  return await withTransaction(async (client) => {
    const poResult = await client.query(
      'SELECT status FROM purchase_orders WHERE id = $1',
      [id]
    )

    if (poResult.rows.length === 0) {
      throw new Error('Purchase order not found')
    }

    if (poResult.rows[0].status === 'received') {
      throw new Error('Cannot cancel received purchase order')
    }

    await client.query(
      'UPDATE purchase_orders SET status = $1, updated_at = NOW() WHERE id = $2',
      ['cancelled', id]
    )

    return { message: 'Purchase order cancelled' }
  })
}

export async function getPurchaseOrderWithItems(id) {
  const result = await query(`
    SELECT 
      po.*,
      s.name as supplier_name,
      s.email as supplier_email,
      s.phone as supplier_phone,
      s.contact_person,
      u.name as created_by_name
    FROM purchase_orders po
    JOIN suppliers s ON po.supplier_id = s.id
    LEFT JOIN users u ON po.created_by = u.id
    WHERE po.id = $1
  `, [id])

  if (result.rows.length === 0) {
    return null
  }

  const po = result.rows[0]

  const itemsResult = await query(`
    SELECT 
      poi.*,
      p.name as full_product_name
    FROM purchase_order_items poi
    LEFT JOIN products p ON poi.product_id = p.id
    WHERE poi.purchase_order_id = $1
    ORDER BY poi.created_at
  `, [id])

  return {
    ...po,
    items: itemsResult.rows
  }
}

export async function getPurchaseOrderStats(supplierId) {
  const result = await query(`
    SELECT 
      COUNT(DISTINCT po.id) as total_orders,
      COUNT(DISTINCT CASE WHEN po.status = 'pending' THEN po.id END) as pending_orders,
      COUNT(DISTINCT CASE WHEN po.status = 'partial' THEN po.id END) as partial_orders,
      COUNT(DISTINCT CASE WHEN po.status = 'received' THEN po.id END) as received_orders,
      SUM(po.total_amount) as total_amount,
      AVG(po.total_amount) as avg_order_amount
    FROM purchase_orders po
    WHERE po.supplier_id = $1
  `, [supplierId])

  return result.rows[0]
}
