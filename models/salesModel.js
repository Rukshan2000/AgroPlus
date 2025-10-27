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
  payment_method = 'cash',
  amount_paid,
  change_given = 0,
  created_by
}) {
  // Get the product's buying price for profit calculation
  const productResult = await query('SELECT buying_price, selling_price FROM products WHERE id = $1', [product_id]);
  const product = productResult.rows[0];
  
  const buying_price_at_sale = product ? product.buying_price : 0;
  const profit_per_unit = unit_price - buying_price_at_sale;
  const total_profit = profit_per_unit * quantity;
  const profit_margin_percentage = unit_price > 0 ? ((profit_per_unit / unit_price) * 100) : 0;

  const result = await query(`
    INSERT INTO sales (
      product_id, product_name, quantity, unit_price, original_price, 
      discount_percentage, discount_amount, total_amount, 
      payment_method, amount_paid, change_given, created_by,
      buying_price_at_sale, profit_per_unit, total_profit, profit_margin_percentage
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *
  `, [
    product_id, product_name, quantity, unit_price, original_price,
    discount_percentage, discount_amount, total_amount,
    payment_method, amount_paid, change_given, created_by,
    buying_price_at_sale, profit_per_unit, total_profit, profit_margin_percentage
  ])
  return result.rows[0]
}

export async function listSales({ page = 1, limit = 10, start_date, end_date, product_id } = {}) {
  const offset = (page - 1) * limit
  let whereConditions = []
  let params = []
  let paramIndex = 1

  if (start_date) {
    whereConditions.push(`s.created_at >= $${paramIndex}`)
    params.push(start_date)
    paramIndex++
  }

  if (end_date) {
    whereConditions.push(`s.created_at <= $${paramIndex}`)
    params.push(end_date)
    paramIndex++
  }

  if (product_id) {
    whereConditions.push(`s.product_id = $${paramIndex}`)
    params.push(product_id)
    paramIndex++
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

  const result = await query(`
    SELECT s.*, p.sku, p.category, u.name as sold_by
    FROM sales s
    LEFT JOIN products p ON s.product_id = p.id
    LEFT JOIN users u ON s.created_by = u.id
    ${whereClause}
    ORDER BY s.created_at DESC
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
    SELECT s.*, p.sku, p.category, u.name as sold_by
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
      SUM(total_profit) as total_profit,
      SUM(quantity) as total_items_sold,
      AVG(total_amount) as average_sale_amount,
      AVG(profit_margin_percentage) as average_profit_margin,
      SUM(total_amount) - SUM(total_profit) as total_cost
    FROM sales
  `)
  return result.rows[0]
}

export async function getDailySalesStats(days = 30) {
  const result = await query(`
    SELECT 
      DATE(created_at) as created_at,
      COUNT(*) as sales_count,
      SUM(total_amount) as daily_revenue,
      SUM(total_profit) as daily_profit,
      SUM(quantity) as items_sold,
      AVG(profit_margin_percentage) as avg_profit_margin,
      SUM(total_amount) - SUM(total_profit) as daily_cost
    FROM sales
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY created_at DESC
  `)
  return result.rows
}

export async function getHourlySalesPattern() {
  const result = await query(`
    SELECT 
      EXTRACT(HOUR FROM created_at) as hour,
      COUNT(*) as sales_count,
      SUM(total_amount) as revenue,
      SUM(total_profit) as profit,
      AVG(total_amount) as avg_sale_amount,
      AVG(profit_margin_percentage) as avg_profit_margin
    FROM sales
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY EXTRACT(HOUR FROM created_at)
    ORDER BY hour
  `)
  return result.rows
}

export async function getMonthlyTrends() {
  const result = await query(`
    SELECT 
      DATE_TRUNC('month', created_at) as month,
      COUNT(*) as sales_count,
      SUM(total_amount) as revenue,
      SUM(total_profit) as profit,
      SUM(quantity) as items_sold,
      COUNT(DISTINCT created_by) as active_cashiers,
      AVG(profit_margin_percentage) as avg_profit_margin,
      SUM(total_amount) - SUM(total_profit) as total_cost
    FROM sales
    WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month DESC
  `)
  return result.rows
}

export async function getLowStockAlerts() {
  const result = await query(`
    SELECT 
      p.id,
      p.name,
      p.sku,
      p.category,
      p.available_quantity,
      p.minimum_quantity,
      COALESCE(SUM(s.quantity), 0) as total_sold,
      COUNT(s.id) as sales_count
    FROM products p
    LEFT JOIN sales s ON p.id = s.product_id AND s.created_at >= CURRENT_DATE - INTERVAL '30 days'
    WHERE p.available_quantity <= COALESCE(p.minimum_quantity, 5) OR p.available_quantity <= 5
    GROUP BY p.id, p.name, p.sku, p.category, p.available_quantity, p.minimum_quantity
    ORDER BY p.available_quantity ASC
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
      p.buying_price,
      p.selling_price,
      SUM(s.quantity) as total_quantity_sold,
      SUM(s.total_amount) as total_revenue,
      SUM(s.total_profit) as total_profit,
      COUNT(s.id) as sales_count,
      AVG(s.profit_margin_percentage) as avg_profit_margin
    FROM sales s
    JOIN products p ON s.product_id = p.id
    GROUP BY p.id, p.name, p.sku, p.category, p.buying_price, p.selling_price
    ORDER BY total_quantity_sold DESC
    LIMIT $1
  `, [limit])
  return result.rows
}

export async function getCategorySalesStats() {
  const result = await query(`
    SELECT 
      p.category,
      COUNT(s.id) as sales_count,
      SUM(s.quantity) as total_quantity,
      SUM(s.total_amount) as total_revenue,
      SUM(s.total_profit) as total_profit,
      AVG(s.total_amount) as avg_sale_amount,
      AVG(s.profit_margin_percentage) as avg_profit_margin,
      SUM(s.total_amount) - SUM(s.total_profit) as total_cost
    FROM sales s
    JOIN products p ON s.product_id = p.id
    WHERE p.category IS NOT NULL
    GROUP BY p.category
    ORDER BY total_revenue DESC
  `)
  return result.rows
}

export async function getCashierPerformance() {
  const result = await query(`
    SELECT 
      u.id,
      u.name,
      COUNT(s.id) as total_sales,
      SUM(s.quantity) as items_sold,
      SUM(s.total_amount) as total_revenue,
      SUM(s.total_profit) as total_profit,
      AVG(s.total_amount) as avg_sale_amount,
      AVG(s.profit_margin_percentage) as avg_profit_margin,
      DATE(MIN(s.created_at)) as first_created_at,
      DATE(MAX(s.created_at)) as last_created_at
    FROM sales s
    JOIN users u ON s.created_by = u.id
    GROUP BY u.id, u.name
    ORDER BY total_revenue DESC
  `)
  return result.rows
}

// New profit analysis functions
export async function getProfitAnalysis(days = 30) {
  const result = await query(`
    SELECT 
      DATE(created_at) as date,
      SUM(total_amount) as revenue,
      SUM(total_profit) as profit,
      SUM(total_amount) - SUM(total_profit) as cost,
      AVG(profit_margin_percentage) as avg_profit_margin,
      COUNT(*) as transactions
    FROM sales
    WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `)
  return result.rows
}

export async function getTopProfitableProducts(limit = 10) {
  const result = await query(`
    SELECT 
      p.id,
      p.name,
      p.sku,
      p.category,
      p.buying_price,
      p.selling_price,
      SUM(s.total_profit) as total_profit,
      SUM(s.total_amount) as total_revenue,
      AVG(s.profit_margin_percentage) as avg_profit_margin,
      SUM(s.quantity) as total_quantity_sold
    FROM sales s
    JOIN products p ON s.product_id = p.id
    GROUP BY p.id, p.name, p.sku, p.category, p.buying_price, p.selling_price
    ORDER BY total_profit DESC
    LIMIT $1
  `, [limit])
  return result.rows
}

export async function getMostProfitableCategories() {
  const result = await query(`
    SELECT 
      p.category,
      SUM(s.total_profit) as total_profit,
      SUM(s.total_amount) as total_revenue,
      AVG(s.profit_margin_percentage) as avg_profit_margin,
      COUNT(s.id) as total_sales,
      SUM(s.quantity) as total_items_sold
    FROM sales s
    JOIN products p ON s.product_id = p.id
    WHERE p.category IS NOT NULL
    GROUP BY p.category
    ORDER BY total_profit DESC
  `)
  return result.rows
}

export async function getProfitTrends(months = 12) {
  const result = await query(`
    SELECT 
      DATE_TRUNC('month', created_at) as month,
      SUM(total_amount) as revenue,
      SUM(total_profit) as profit,
      SUM(total_amount) - SUM(total_profit) as cost,
      AVG(profit_margin_percentage) as avg_profit_margin,
      COUNT(*) as transactions
    FROM sales
    WHERE created_at >= CURRENT_DATE - INTERVAL '${months} months'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month DESC
  `)
  return result.rows
}
