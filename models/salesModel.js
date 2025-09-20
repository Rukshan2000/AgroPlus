import { query } from "../lib/db"

export async function createSale({
  product_id,
  product_name,
  quantity,
  unit_price,
  original_price,
  discount_percentage = 0,
  discount_amount = 0,
  total_amount,
  created_by
}) {
  const result = await query(`
    INSERT INTO sales (
      product_id, product_name, quantity, unit_price, original_price, 
      discount_percentage, discount_amount, total_amount, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [
    product_id, product_name, quantity, unit_price, original_price,
    discount_percentage, discount_amount, total_amount, created_by
  ])
  return result.rows[0]
}

export async function listSales({ page = 1, limit = 10, start_date, end_date, product_id } = {}) {
  const offset = (page - 1) * limit
  let whereConditions = []
  let params = []
  let paramIndex = 1

  if (start_date) {
    whereConditions.push(`sale_date >= $${paramIndex}`)
    params.push(start_date)
    paramIndex++
  }

  if (end_date) {
    whereConditions.push(`sale_date <= $${paramIndex}`)
    params.push(end_date)
    paramIndex++
  }

  if (product_id) {
    whereConditions.push(`product_id = $${paramIndex}`)
    params.push(product_id)
    paramIndex++
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

  const result = await query(`
    SELECT s.*, p.sku, p.category, u.username as sold_by
    FROM sales s
    LEFT JOIN products p ON s.product_id = p.id
    LEFT JOIN users u ON s.created_by = u.id
    ${whereClause}
    ORDER BY s.sale_date DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `, [...params, limit, offset])

  const countResult = await query(`
    SELECT COUNT(*) as total
    FROM sales s
    ${whereClause}
  `, params)

  return {
    sales: result.rows,
    total: parseInt(countResult.rows[0].total),
    page,
    limit,
    totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
  }
}

export async function getSaleById(id) {
  const result = await query(`
    SELECT s.*, p.sku, p.category, u.username as sold_by
    FROM sales s
    LEFT JOIN products p ON s.product_id = p.id
    LEFT JOIN users u ON s.created_by = u.id
    WHERE s.id = $1
    LIMIT 1
  `, [id])
  return result.rows[0] || null
}

export async function getSalesStats() {
  const result = await query(`
    SELECT 
      COUNT(*) as total_sales,
      SUM(total_amount) as total_revenue,
      SUM(quantity) as total_items_sold,
      AVG(total_amount) as average_sale_amount
    FROM sales
  `)
  return result.rows[0]
}

export async function getDailySalesStats(days = 30) {
  const result = await query(`
    SELECT 
      DATE(sale_date) as sale_date,
      COUNT(*) as sales_count,
      SUM(total_amount) as daily_revenue,
      SUM(quantity) as items_sold
    FROM sales
    WHERE sale_date >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE(sale_date)
    ORDER BY sale_date DESC
  `)
  return result.rows
}

export async function getTopSellingProducts(limit = 10) {
  const result = await query(`
    SELECT 
      p.id,
      p.name,
      p.sku,
      p.category,
      SUM(s.quantity) as total_quantity_sold,
      SUM(s.total_amount) as total_revenue,
      COUNT(s.id) as sales_count
    FROM sales s
    JOIN products p ON s.product_id = p.id
    GROUP BY p.id, p.name, p.sku, p.category
    ORDER BY total_quantity_sold DESC
    LIMIT $1
  `, [limit])
  return result.rows
}
