import { query } from "../lib/db"

// ==================== SALES REPORTS ====================

/**
 * Daily Sales Summary Report
 * Total sales, number of transactions, average ticket size, payment types, discounts, refunds
 */
export async function getDailySalesSummary({ date = null, start_date = null, end_date = null } = {}) {
  let dateFilter = ''
  let params = []
  let paramIndex = 1

  if (date) {
    dateFilter = `WHERE DATE(s.created_at) = $${paramIndex}`
    params.push(date)
    paramIndex++
  } else if (start_date && end_date) {
    dateFilter = `WHERE DATE(s.created_at) BETWEEN $${paramIndex} AND $${paramIndex + 1}`
    params.push(start_date, end_date)
    paramIndex += 2
  } else {
    dateFilter = `WHERE DATE(s.created_at) = CURRENT_DATE`
  }

  const result = await query(`
    SELECT 
      DATE(s.created_at) as created_at,
      COUNT(DISTINCT s.id) as total_transactions,
      COUNT(*) as total_line_items,
      SUM(s.total_amount) as total_sales,
      AVG(s.total_amount) as avg_ticket_size,
      SUM(s.discount_amount) as total_discounts,
      SUM(CASE WHEN s.quantity < 0 THEN ABS(s.total_amount) ELSE 0 END) as total_refunds,
      SUM(CASE WHEN s.payment_method = 'cash' THEN s.total_amount ELSE 0 END) as cash_sales,
      SUM(CASE WHEN s.payment_method = 'card' THEN s.total_amount ELSE 0 END) as card_sales,
      SUM(CASE WHEN s.payment_method = 'digital' THEN s.total_amount ELSE 0 END) as digital_sales,
      SUM(CASE WHEN s.payment_method = 'other' THEN s.total_amount ELSE 0 END) as other_sales,
      SUM(s.total_profit) as total_profit,
      CASE 
        WHEN SUM(s.total_amount) > 0 
        THEN (SUM(s.total_profit) / SUM(s.total_amount)) * 100 
        ELSE 0 
      END as profit_margin_percentage
    FROM sales s
    ${dateFilter}
    GROUP BY DATE(s.created_at)
    ORDER BY DATE(s.created_at) DESC
  `, params)

  return result.rows
}

/**
 * Sales by Product/Item Report
 * Which products sell the most/least
 */
export async function getSalesByProduct({ start_date = null, end_date = null, limit = 50, order = 'DESC' } = {}) {
  let dateFilter = ''
  let params = []
  let paramIndex = 1

  if (start_date && end_date) {
    dateFilter = `WHERE DATE(s.created_at) BETWEEN $${paramIndex} AND $${paramIndex + 1}`
    params.push(start_date, end_date)
    paramIndex += 2
  }

  params.push(limit)

  const result = await query(`
    SELECT 
      s.product_id,
      s.product_name,
      p.sku,
      p.category,
      SUM(CASE WHEN s.quantity > 0 THEN s.quantity ELSE 0 END) as total_quantity_sold,
      COUNT(CASE WHEN s.quantity > 0 THEN 1 END) as number_of_sales,
      SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END) as total_revenue,
      AVG(CASE WHEN s.quantity > 0 THEN s.unit_price ELSE NULL END) as avg_selling_price,
      SUM(CASE WHEN s.quantity > 0 THEN s.discount_amount ELSE 0 END) as total_discounts_given,
      SUM(CASE WHEN s.quantity > 0 THEN s.total_profit ELSE 0 END) as total_profit,
      CASE 
        WHEN SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END) > 0 
        THEN (SUM(CASE WHEN s.quantity > 0 THEN s.total_profit ELSE 0 END) / 
              SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END)) * 100 
        ELSE 0 
      END as profit_margin_percentage,
      p.available_quantity as current_stock
    FROM sales s
    LEFT JOIN products p ON s.product_id = p.id
    ${dateFilter}
    GROUP BY s.product_id, s.product_name, p.sku, p.category, p.available_quantity
    HAVING SUM(CASE WHEN s.quantity > 0 THEN s.quantity ELSE 0 END) > 0
    ORDER BY total_revenue ${order}
    LIMIT $${paramIndex}
  `, params)

  return result.rows
}

/**
 * Sales by Category Report
 * Performance of product groups
 */
export async function getSalesByCategory({ start_date = null, end_date = null } = {}) {
  let dateFilter = ''
  let params = []
  let paramIndex = 1

  if (start_date && end_date) {
    dateFilter = `WHERE DATE(s.created_at) BETWEEN $${paramIndex} AND $${paramIndex + 1}`
    params.push(start_date, end_date)
    paramIndex += 2
  }

  const result = await query(`
    SELECT 
      COALESCE(p.category, 'Uncategorized') as category,
      c.name as category_name,
      COUNT(DISTINCT s.product_id) as unique_products_sold,
      SUM(CASE WHEN s.quantity > 0 THEN s.quantity ELSE 0 END) as total_quantity_sold,
      COUNT(CASE WHEN s.quantity > 0 THEN 1 END) as number_of_sales,
      SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END) as total_revenue,
      SUM(CASE WHEN s.quantity > 0 THEN s.discount_amount ELSE 0 END) as total_discounts,
      SUM(CASE WHEN s.quantity > 0 THEN s.total_profit ELSE 0 END) as total_profit,
      CASE 
        WHEN SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END) > 0 
        THEN (SUM(CASE WHEN s.quantity > 0 THEN s.total_profit ELSE 0 END) / 
              SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END)) * 100 
        ELSE 0 
      END as profit_margin_percentage
    FROM sales s
    LEFT JOIN products p ON s.product_id = p.id
    LEFT JOIN categories c ON p.category = c.id
    ${dateFilter}
    GROUP BY p.category, c.name
    HAVING SUM(CASE WHEN s.quantity > 0 THEN s.quantity ELSE 0 END) > 0
    ORDER BY total_revenue DESC
  `, params)

  return result.rows
}

/**
 * Sales by Hour/Shift Report
 * Identifies peak business hours
 */
export async function getSalesByHour({ date = null, start_date = null, end_date = null } = {}) {
  let dateFilter = ''
  let params = []
  let paramIndex = 1

  if (date) {
    dateFilter = `WHERE DATE(s.created_at) = $${paramIndex}`
    params.push(date)
  } else if (start_date && end_date) {
    dateFilter = `WHERE DATE(s.created_at) BETWEEN $${paramIndex} AND $${paramIndex + 1}`
    params.push(start_date, end_date)
  } else {
    dateFilter = `WHERE DATE(s.created_at) = CURRENT_DATE`
  }

  const result = await query(`
    SELECT 
      EXTRACT(HOUR FROM s.created_at) as hour,
      CASE 
        WHEN EXTRACT(HOUR FROM s.created_at) BETWEEN 6 AND 11 THEN 'Morning (6AM-12PM)'
        WHEN EXTRACT(HOUR FROM s.created_at) BETWEEN 12 AND 17 THEN 'Afternoon (12PM-6PM)'
        WHEN EXTRACT(HOUR FROM s.created_at) BETWEEN 18 AND 21 THEN 'Evening (6PM-10PM)'
        ELSE 'Night (10PM-6AM)'
      END as shift,
      COUNT(DISTINCT s.id) as total_transactions,
      SUM(CASE WHEN s.quantity > 0 THEN s.quantity ELSE 0 END) as total_items_sold,
      SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END) as total_sales,
      AVG(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE NULL END) as avg_transaction_value,
      SUM(CASE WHEN s.quantity > 0 THEN s.total_profit ELSE 0 END) as total_profit
    FROM sales s
    ${dateFilter}
    GROUP BY EXTRACT(HOUR FROM s.created_at), shift
    ORDER BY hour
  `, params)

  return result.rows
}

/**
 * Discounts & Returns Report
 * Shows all discounts and refunds issued
 */
export async function getDiscountsAndReturns({ start_date = null, end_date = null } = {}) {
  let dateFilter = ''
  let params = []
  let paramIndex = 1

  if (start_date && end_date) {
    dateFilter = `WHERE DATE(s.created_at) BETWEEN $${paramIndex} AND $${paramIndex + 1}`
    params.push(start_date, end_date)
  }

  const result = await query(`
    SELECT 
      s.id,
      s.id,
      s.created_at,
      s.product_name,
      s.quantity,
      s.original_price,
      s.unit_price,
      s.discount_percentage,
      s.discount_amount,
      s.total_amount,
      s.payment_method,
      u.name as cashier_name,
      CASE 
        WHEN s.quantity < 0 THEN 'Return'
        WHEN s.discount_percentage > 0 THEN 'Discount'
        ELSE 'Regular'
      END as transaction_type
    FROM sales s
    LEFT JOIN users u ON s.created_by = u.id
    ${dateFilter}
    ${dateFilter ? 'AND' : 'WHERE'} (s.discount_percentage > 0 OR s.quantity < 0)
    ORDER BY s.created_at DESC
  `, params)

  return result.rows
}

// ==================== INVENTORY REPORTS ====================

/**
 * Stock on Hand Report
 * Current quantity and value of each item
 */
export async function getStockOnHand({ category = null, low_stock_only = false } = {}) {
  let whereConditions = ['p.is_active = true']
  let params = []
  let paramIndex = 1

  if (category) {
    whereConditions.push(`p.category = $${paramIndex}`)
    params.push(category)
    paramIndex++
  }

  if (low_stock_only) {
    whereConditions.push(`p.available_quantity <= p.minimum_quantity`)
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

  const result = await query(`
    SELECT 
      p.id,
      p.name,
      p.sku,
      p.category,
      c.name as category_name,
      p.stock_quantity,
      p.available_quantity,
      p.minimum_quantity,
      p.buying_price,
      p.selling_price,
      p.price as retail_price,
      (p.available_quantity * p.buying_price) as stock_value_at_cost,
      (p.available_quantity * p.price) as stock_value_at_retail,
      p.unit_type,
      p.unit_value,
      p.expiry_date,
      CASE 
        WHEN p.available_quantity <= 0 THEN 'Out of Stock'
        WHEN p.available_quantity <= p.minimum_quantity THEN 'Low Stock'
        WHEN p.available_quantity <= p.minimum_quantity * 2 THEN 'Adequate'
        ELSE 'Good'
      END as stock_status,
      CASE 
        WHEN p.expiry_date IS NOT NULL AND p.expiry_date <= CURRENT_DATE THEN 'Expired'
        WHEN p.expiry_date IS NOT NULL AND p.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'Expiring Soon'
        ELSE 'OK'
      END as expiry_status
    FROM products p
    LEFT JOIN categories c ON p.category = c.id
    ${whereClause}
    ORDER BY 
      CASE 
        WHEN p.available_quantity <= 0 THEN 1
        WHEN p.available_quantity <= p.minimum_quantity THEN 2
        ELSE 3
      END,
      p.name
  `, params)

  return result.rows
}

/**
 * Low Stock / Reorder Report
 * Items that are below the minimum threshold
 */
export async function getLowStockReport() {
  const result = await query(`
    SELECT 
      p.id,
      p.name,
      p.sku,
      p.category,
      c.name as category_name,
      p.available_quantity,
      p.minimum_quantity,
      (p.minimum_quantity - p.available_quantity) as qty_to_order,
      p.buying_price,
      ((p.minimum_quantity * 2) - p.available_quantity) * p.buying_price as estimated_reorder_cost,
      p.unit_type,
      p.unit_value,
      COALESCE(sales_data.avg_daily_sales, 0) as avg_daily_sales,
      CASE 
        WHEN COALESCE(sales_data.avg_daily_sales, 0) > 0 
        THEN ROUND(p.available_quantity / sales_data.avg_daily_sales)
        ELSE 999
      END as days_of_stock_remaining
    FROM products p
    LEFT JOIN categories c ON p.category = c.id
    LEFT JOIN (
      SELECT 
        product_id,
        AVG(daily_quantity) as avg_daily_sales
      FROM (
        SELECT 
          product_id,
          DATE(created_at) as sale_day,
          SUM(quantity) as daily_quantity
        FROM sales
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
          AND quantity > 0
        GROUP BY product_id, DATE(created_at)
      ) daily_sales
      GROUP BY product_id
    ) sales_data ON p.id = sales_data.product_id
    WHERE p.is_active = true 
      AND p.available_quantity <= p.minimum_quantity
    ORDER BY 
      CASE 
        WHEN p.available_quantity <= 0 THEN 1
        ELSE 2
      END,
      days_of_stock_remaining,
      p.name
  `)

  return result.rows
}

/**
 * Inventory Valuation Report
 * Total stock value at cost and retail
 */
export async function getInventoryValuation({ category = null } = {}) {
  let whereConditions = ['p.is_active = true']
  let params = []
  let paramIndex = 1

  if (category) {
    whereConditions.push(`p.category = $${paramIndex}`)
    params.push(category)
    paramIndex++
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

  const result = await query(`
    SELECT 
      COALESCE(p.category, 0) as category_id,
      COALESCE(c.name, 'Uncategorized') as category_name,
      COUNT(p.id) as total_products,
      SUM(p.available_quantity) as total_quantity,
      SUM(p.available_quantity * p.buying_price) as total_cost_value,
      SUM(p.available_quantity * p.price) as total_retail_value,
      SUM(p.available_quantity * (p.price - p.buying_price)) as potential_profit,
      CASE 
        WHEN SUM(p.available_quantity * p.buying_price) > 0
        THEN (SUM(p.available_quantity * (p.price - p.buying_price)) / 
              SUM(p.available_quantity * p.buying_price)) * 100
        ELSE 0
      END as profit_margin_percentage
    FROM products p
    LEFT JOIN categories c ON p.category = c.id
    ${whereClause}
    GROUP BY p.category, c.name
    ORDER BY total_retail_value DESC
  `, params)

  // Add grand total
  const grandTotal = await query(`
    SELECT 
      'GRAND TOTAL' as category_name,
      COUNT(p.id) as total_products,
      SUM(p.available_quantity) as total_quantity,
      SUM(p.available_quantity * p.buying_price) as total_cost_value,
      SUM(p.available_quantity * p.price) as total_retail_value,
      SUM(p.available_quantity * (p.price - p.buying_price)) as potential_profit,
      CASE 
        WHEN SUM(p.available_quantity * p.buying_price) > 0
        THEN (SUM(p.available_quantity * (p.price - p.buying_price)) / 
              SUM(p.available_quantity * p.buying_price)) * 100
        ELSE 0
      END as profit_margin_percentage
    FROM products p
    ${whereClause}
  `, params)

  return {
    categories: result.rows,
    grand_total: grandTotal.rows[0]
  }
}

/**
 * Stock Movement Report
 * Incoming, outgoing, and adjusted quantities
 */
export async function getStockMovement({ product_id = null, start_date = null, end_date = null } = {}) {
  let whereConditions = []
  let params = []
  let paramIndex = 1

  if (product_id) {
    whereConditions.push(`s.product_id = $${paramIndex}`)
    params.push(product_id)
    paramIndex++
  }

  if (start_date && end_date) {
    whereConditions.push(`DATE(s.created_at) BETWEEN $${paramIndex} AND $${paramIndex + 1}`)
    params.push(start_date, end_date)
    paramIndex += 2
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

  const result = await query(`
    SELECT 
      s.product_id,
      s.product_name,
      p.sku,
      DATE(s.created_at) as movement_date,
      SUM(CASE WHEN s.quantity > 0 THEN s.quantity ELSE 0 END) as quantity_out,
      SUM(CASE WHEN s.quantity < 0 THEN ABS(s.quantity) ELSE 0 END) as quantity_in_returns,
      SUM(s.quantity) as net_movement,
      p.available_quantity as current_stock
    FROM sales s
    LEFT JOIN products p ON s.product_id = p.id
    ${whereClause}
    GROUP BY s.product_id, s.product_name, p.sku, DATE(s.created_at), p.available_quantity
    ORDER BY movement_date DESC, s.product_name
  `, params)

  return result.rows
}

// ==================== FINANCIAL REPORTS ====================

/**
 * Profit & Loss Report (P&L)
 * Revenue, cost of goods sold, and profit margin
 */
export async function getProfitAndLoss({ start_date = null, end_date = null } = {}) {
  let dateFilter = ''
  let params = []
  let paramIndex = 1

  if (start_date && end_date) {
    dateFilter = `WHERE DATE(s.created_at) BETWEEN $${paramIndex} AND $${paramIndex + 1}`
    params.push(start_date, end_date)
    paramIndex += 2
  }

  const result = await query(`
    SELECT 
      DATE(s.created_at) as report_date,
      
      -- Revenue
      SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END) as gross_revenue,
      SUM(CASE WHEN s.quantity > 0 THEN s.discount_amount ELSE 0 END) as total_discounts,
      SUM(CASE WHEN s.quantity < 0 THEN ABS(s.total_amount) ELSE 0 END) as refunds,
      SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END) - 
        SUM(CASE WHEN s.quantity < 0 THEN ABS(s.total_amount) ELSE 0 END) as net_revenue,
      
      -- Cost of Goods Sold
      SUM(CASE WHEN s.quantity > 0 THEN (s.buying_price_at_sale * s.quantity) ELSE 0 END) as cogs,
      
      -- Profit
      SUM(CASE WHEN s.quantity > 0 THEN s.total_profit ELSE 0 END) as gross_profit,
      SUM(s.total_profit) as net_profit,
      
      -- Margins
      CASE 
        WHEN SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END) > 0
        THEN (SUM(CASE WHEN s.quantity > 0 THEN s.total_profit ELSE 0 END) / 
              SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END)) * 100
        ELSE 0
      END as gross_profit_margin_percentage,
      
      CASE 
        WHEN (SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END) - 
              SUM(CASE WHEN s.quantity < 0 THEN ABS(s.total_amount) ELSE 0 END)) > 0
        THEN (SUM(s.total_profit) / 
              (SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END) - 
               SUM(CASE WHEN s.quantity < 0 THEN ABS(s.total_amount) ELSE 0 END))) * 100
        ELSE 0
      END as net_profit_margin_percentage,
      
      -- Transactions
      COUNT(DISTINCT s.id) as total_transactions
      
    FROM sales s
    ${dateFilter}
    GROUP BY DATE(s.created_at)
    ORDER BY report_date DESC
  `, params)

  return result.rows
}

/**
 * Payment Type Report
 * Breakdown by cash, card, digital wallet, etc.
 */
export async function getPaymentTypeReport({ start_date = null, end_date = null } = {}) {
  let dateFilter = ''
  let params = []
  let paramIndex = 1

  if (start_date && end_date) {
    dateFilter = `WHERE DATE(s.created_at) BETWEEN $${paramIndex} AND $${paramIndex + 1}`
    params.push(start_date, end_date)
    paramIndex += 2
  }

  const result = await query(`
    SELECT 
      s.payment_method,
      COUNT(DISTINCT s.id) as total_transactions,
      SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END) as total_sales,
      AVG(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE NULL END) as avg_transaction_value,
      SUM(CASE WHEN s.quantity > 0 THEN s.total_profit ELSE 0 END) as total_profit,
      CASE 
        WHEN SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END) > 0
        THEN (SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END) / 
              (SELECT SUM(total_amount) FROM sales WHERE quantity > 0 ${dateFilter.replace('WHERE', 'AND')})) * 100
        ELSE 0
      END as percentage_of_total
    FROM sales s
    ${dateFilter}
    GROUP BY s.payment_method
    ORDER BY total_sales DESC
  `, params)

  return result.rows
}

/**
 * Cash Flow Report
 * Inflow and outflow of money
 */
export async function getCashFlowReport({ start_date = null, end_date = null } = {}) {
  let dateFilter = ''
  let params = []
  let paramIndex = 1

  if (start_date && end_date) {
    dateFilter = `WHERE DATE(s.created_at) BETWEEN $${paramIndex} AND $${paramIndex + 1}`
    params.push(start_date, end_date)
    paramIndex += 2
  }

  const result = await query(`
    SELECT 
      DATE(s.created_at) as flow_date,
      
      -- Cash Inflows
      SUM(CASE WHEN s.quantity > 0 THEN s.amount_paid ELSE 0 END) as cash_inflow,
      
      -- Cash Outflows (refunds/returns)
      SUM(CASE WHEN s.quantity < 0 THEN ABS(s.amount_paid) ELSE 0 END) as cash_outflow,
      
      -- Net Cash Flow
      SUM(s.amount_paid) as net_cash_flow,
      
      -- By Payment Method
      SUM(CASE WHEN s.quantity > 0 AND s.payment_method = 'cash' THEN s.amount_paid ELSE 0 END) as cash_received,
      SUM(CASE WHEN s.quantity > 0 AND s.payment_method = 'card' THEN s.amount_paid ELSE 0 END) as card_received,
      SUM(CASE WHEN s.quantity > 0 AND s.payment_method = 'digital' THEN s.amount_paid ELSE 0 END) as digital_received,
      
      -- Change Given
      SUM(CASE WHEN s.quantity > 0 THEN s.change_given ELSE 0 END) as total_change_given,
      
      -- Net Cash in Hand (cash received - change given - cash refunds)
      SUM(CASE WHEN s.quantity > 0 AND s.payment_method = 'cash' THEN s.amount_paid ELSE 0 END) -
      SUM(CASE WHEN s.quantity > 0 THEN s.change_given ELSE 0 END) -
      SUM(CASE WHEN s.quantity < 0 AND s.payment_method = 'cash' THEN ABS(s.amount_paid) ELSE 0 END) as net_cash_in_hand
      
    FROM sales s
    ${dateFilter}
    GROUP BY DATE(s.created_at)
    ORDER BY flow_date DESC
  `, params)

  return result.rows
}

// ==================== ANALYTICS / INSIGHTS REPORTS ====================

/**
 * Sales Trend Analysis
 * Compare performance over time (daily, monthly, yearly)
 */
export async function getSalesTrendAnalysis({ period = 'daily', start_date = null, end_date = null } = {}) {
  let dateFilter = ''
  let params = []
  let paramIndex = 1

  if (start_date && end_date) {
    dateFilter = `WHERE DATE(s.created_at) BETWEEN $${paramIndex} AND $${paramIndex + 1}`
    params.push(start_date, end_date)
    paramIndex += 2
  } else {
    // Default to last 30 days for daily, last 12 months for monthly
    if (period === 'daily') {
      dateFilter = `WHERE s.created_at >= CURRENT_DATE - INTERVAL '30 days'`
    } else if (period === 'monthly') {
      dateFilter = `WHERE s.created_at >= CURRENT_DATE - INTERVAL '12 months'`
    } else if (period === 'yearly') {
      dateFilter = `WHERE s.created_at >= CURRENT_DATE - INTERVAL '5 years'`
    }
  }

  let groupBy = ''
  let selectPeriod = ''

  if (period === 'daily') {
    selectPeriod = `DATE(s.created_at) as period`
    groupBy = `DATE(s.created_at)`
  } else if (period === 'monthly') {
    selectPeriod = `TO_CHAR(s.created_at, 'YYYY-MM') as period`
    groupBy = `TO_CHAR(s.created_at, 'YYYY-MM')`
  } else if (period === 'yearly') {
    selectPeriod = `EXTRACT(YEAR FROM s.created_at) as period`
    groupBy = `EXTRACT(YEAR FROM s.created_at)`
  }

  const result = await query(`
    SELECT 
      ${selectPeriod},
      COUNT(DISTINCT s.id) as total_transactions,
      SUM(CASE WHEN s.quantity > 0 THEN s.quantity ELSE 0 END) as total_items_sold,
      SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END) as total_sales,
      SUM(CASE WHEN s.quantity > 0 THEN s.total_profit ELSE 0 END) as total_profit,
      AVG(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE NULL END) as avg_transaction_value,
      CASE 
        WHEN SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END) > 0
        THEN (SUM(CASE WHEN s.quantity > 0 THEN s.total_profit ELSE 0 END) / 
              SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END)) * 100
        ELSE 0
      END as profit_margin_percentage
    FROM sales s
    ${dateFilter}
    GROUP BY ${groupBy}
    ORDER BY period DESC
  `, params)

  return result.rows
}

/**
 * Category Contribution Report
 * Which categories drive the most profit
 */
export async function getCategoryContribution({ start_date = null, end_date = null } = {}) {
  let dateFilter = ''
  let params = []
  let paramIndex = 1

  if (start_date && end_date) {
    dateFilter = `WHERE DATE(s.created_at) BETWEEN $${paramIndex} AND $${paramIndex + 1}`
    params.push(start_date, end_date)
    paramIndex += 2
  }

  const result = await query(`
    SELECT 
      COALESCE(p.category, 0) as category_id,
      COALESCE(c.name, 'Uncategorized') as category_name,
      COUNT(DISTINCT s.product_id) as unique_products,
      SUM(CASE WHEN s.quantity > 0 THEN s.quantity ELSE 0 END) as total_quantity_sold,
      SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END) as total_revenue,
      SUM(CASE WHEN s.quantity > 0 THEN (s.buying_price_at_sale * s.quantity) ELSE 0 END) as total_cost,
      SUM(CASE WHEN s.quantity > 0 THEN s.total_profit ELSE 0 END) as total_profit,
      CASE 
        WHEN SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END) > 0
        THEN (SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END) / 
              (SELECT SUM(total_amount) FROM sales WHERE quantity > 0 ${dateFilter.replace('WHERE', 'AND')})) * 100
        ELSE 0
      END as revenue_contribution_percentage,
      CASE 
        WHEN SUM(CASE WHEN s.quantity > 0 THEN s.total_profit ELSE 0 END) > 0
        THEN (SUM(CASE WHEN s.quantity > 0 THEN s.total_profit ELSE 0 END) / 
              (SELECT SUM(total_profit) FROM sales WHERE quantity > 0 ${dateFilter.replace('WHERE', 'AND')})) * 100
        ELSE 0
      END as profit_contribution_percentage,
      CASE 
        WHEN SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END) > 0
        THEN (SUM(CASE WHEN s.quantity > 0 THEN s.total_profit ELSE 0 END) / 
              SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END)) * 100
        ELSE 0
      END as profit_margin_percentage
    FROM sales s
    LEFT JOIN products p ON s.product_id = p.id
    LEFT JOIN categories c ON p.category = c.id
    ${dateFilter}
    GROUP BY p.category, c.name
    HAVING SUM(CASE WHEN s.quantity > 0 THEN s.quantity ELSE 0 END) > 0
    ORDER BY total_profit DESC
  `, params)

  return result.rows
}

/**
 * Gross Margin Analysis
 * Profitability by product or category
 */
export async function getGrossMarginAnalysis({ group_by = 'product', start_date = null, end_date = null, limit = 50 } = {}) {
  let dateFilter = ''
  let params = []
  let paramIndex = 1

  if (start_date && end_date) {
    dateFilter = `WHERE DATE(s.created_at) BETWEEN $${paramIndex} AND $${paramIndex + 1}`
    params.push(start_date, end_date)
    paramIndex += 2
  }

  if (group_by === 'product') {
    params.push(limit)
    
    const result = await query(`
      SELECT 
        s.product_id,
        s.product_name,
        p.sku,
        p.category,
        c.name as category_name,
        SUM(CASE WHEN s.quantity > 0 THEN s.quantity ELSE 0 END) as total_quantity_sold,
        SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN s.quantity > 0 THEN (s.buying_price_at_sale * s.quantity) ELSE 0 END) as total_cost,
        SUM(CASE WHEN s.quantity > 0 THEN s.total_profit ELSE 0 END) as gross_profit,
        AVG(CASE WHEN s.quantity > 0 THEN s.profit_margin_percentage ELSE NULL END) as avg_margin_percentage,
        CASE 
          WHEN SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END) > 0
          THEN (SUM(CASE WHEN s.quantity > 0 THEN s.total_profit ELSE 0 END) / 
                SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END)) * 100
          ELSE 0
        END as gross_margin_percentage,
        CASE 
          WHEN SUM(CASE WHEN s.quantity > 0 THEN (s.buying_price_at_sale * s.quantity) ELSE 0 END) > 0
          THEN (SUM(CASE WHEN s.quantity > 0 THEN s.total_profit ELSE 0 END) / 
                SUM(CASE WHEN s.quantity > 0 THEN (s.buying_price_at_sale * s.quantity) ELSE 0 END)) * 100
          ELSE 0
        END as markup_percentage
      FROM sales s
      LEFT JOIN products p ON s.product_id = p.id
      LEFT JOIN categories c ON p.category = c.id
      ${dateFilter}
      GROUP BY s.product_id, s.product_name, p.sku, p.category, c.name
      HAVING SUM(CASE WHEN s.quantity > 0 THEN s.quantity ELSE 0 END) > 0
      ORDER BY gross_profit DESC
      LIMIT $${paramIndex}
    `, params)

    return result.rows
  } else {
    // Group by category
    const result = await query(`
      SELECT 
        COALESCE(p.category, 0) as category_id,
        COALESCE(c.name, 'Uncategorized') as category_name,
        COUNT(DISTINCT s.product_id) as unique_products,
        SUM(CASE WHEN s.quantity > 0 THEN s.quantity ELSE 0 END) as total_quantity_sold,
        SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN s.quantity > 0 THEN (s.buying_price_at_sale * s.quantity) ELSE 0 END) as total_cost,
        SUM(CASE WHEN s.quantity > 0 THEN s.total_profit ELSE 0 END) as gross_profit,
        CASE 
          WHEN SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END) > 0
          THEN (SUM(CASE WHEN s.quantity > 0 THEN s.total_profit ELSE 0 END) / 
                SUM(CASE WHEN s.quantity > 0 THEN s.total_amount ELSE 0 END)) * 100
          ELSE 0
        END as gross_margin_percentage,
        CASE 
          WHEN SUM(CASE WHEN s.quantity > 0 THEN (s.buying_price_at_sale * s.quantity) ELSE 0 END) > 0
          THEN (SUM(CASE WHEN s.quantity > 0 THEN s.total_profit ELSE 0 END) / 
                SUM(CASE WHEN s.quantity > 0 THEN (s.buying_price_at_sale * s.quantity) ELSE 0 END)) * 100
          ELSE 0
        END as markup_percentage
      FROM sales s
      LEFT JOIN products p ON s.product_id = p.id
      LEFT JOIN categories c ON p.category = c.id
      ${dateFilter}
      GROUP BY p.category, c.name
      HAVING SUM(CASE WHEN s.quantity > 0 THEN s.quantity ELSE 0 END) > 0
      ORDER BY gross_profit DESC
    `, params)

    return result.rows
  }
}
