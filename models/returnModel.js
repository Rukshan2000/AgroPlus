import { query } from "../lib/db.js";

/**
 * Create a product return
 */
export async function createReturn({
  sale_id,
  product_id,
  product_name,
  quantity_returned,
  original_quantity,
  return_reason,
  refund_amount,
  restocked = true,
  processed_by,
  outlet_id = null
}) {
  const client = await query('BEGIN');
  
  try {
    // Ensure quantities are integers
    const qty = parseInt(quantity_returned) || 0;
    const origQty = parseInt(original_quantity) || 0;
    
    // Create return record
    const returnResult = await query(`
      INSERT INTO product_returns (
        sale_id, product_id, product_name, quantity_returned,
        original_quantity, return_reason, refund_amount,
        restocked, processed_by, outlet_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      sale_id, product_id, product_name, qty,
      origQty, return_reason, refund_amount,
      restocked, processed_by, outlet_id
    ]);

    // Update product stock if restocked
    if (restocked) {
      await query(`
        UPDATE products 
        SET 
          available_quantity = available_quantity + $1,
          sold_quantity = GREATEST(0, sold_quantity - $1),
          updated_at = NOW()
        WHERE id = $2
      `, [qty, product_id]);
    }

    // Get the sale item details to update profit
    const saleItemResult = await query(`
      SELECT profit_per_unit 
      FROM sales 
      WHERE id = $1 AND product_id = $2
    `, [sale_id, product_id]);

    if (saleItemResult.rows.length > 0) {
      const profitPerUnit = parseFloat(saleItemResult.rows[0].profit_per_unit) || 0;
      
      // Update sales table profit (reduce profit for returned items)
      await query(`
        UPDATE sales 
        SET 
          total_profit = GREATEST(0, total_profit - (CAST($1 AS DECIMAL) * CAST($2 AS DECIMAL))),
          updated_at = NOW()
        WHERE id = $3
      `, [qty, profitPerUnit, sale_id]);
    }

    // Update sale return status
    const returnStatus = qty >= origQty ? 'full' : 'partial';
    await query(`
      UPDATE sales 
      SET return_status = $1 
      WHERE id = $2
    `, [returnStatus, sale_id]);

    // If customer points were awarded, deduct them
    const saleResult = await query(
      'SELECT customer_id FROM sales WHERE id = $1',
      [sale_id]
    );
    
    if (saleResult.rows[0]?.customer_id) {
      const pointsToDeduct = Math.floor(refund_amount);
      await query(`
        UPDATE customers 
        SET points_balance = GREATEST(0, points_balance - $1)
        WHERE id = $2
      `, [pointsToDeduct, saleResult.rows[0].customer_id]);

      // Log the transaction if loyalty_transactions table exists
      try {
        await query(`
          INSERT INTO loyalty_transactions (
            customer_id, sale_id, points, type, description
          )
          VALUES ($1, $2, $3, 'adjustment', $4)
        `, [
          saleResult.rows[0].customer_id,
          sale_id,
          -pointsToDeduct,
          `Return deduction for sale #${sale_id}`
        ]);
      } catch (error) {
        // Loyalty transactions table might not exist, continue
        console.log('Loyalty transaction not logged:', error.message);
      }
    }

    await query('COMMIT');
    return returnResult.rows[0];
    
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}

/**
 * Get returns for a specific sale
 */
export async function getReturnsBySale(sale_id) {
  const result = await query(`
    SELECT r.*, u.name as processed_by_name
    FROM product_returns r
    LEFT JOIN users u ON r.processed_by = u.id
    WHERE r.sale_id = $1
    ORDER BY r.return_date DESC
  `, [sale_id]);
  return result.rows;
}

/**
 * List all returns with pagination and filters
 */
export async function listReturns({ page = 1, limit = 10, start_date, end_date, outlet_id } = {}) {
  const offset = (page - 1) * limit;
  let whereConditions = [];
  let params = [];
  let paramIndex = 1;

  if (start_date) {
    whereConditions.push(`r.return_date >= $${paramIndex}`);
    params.push(start_date);
    paramIndex++;
  }

  if (end_date) {
    whereConditions.push(`r.return_date <= $${paramIndex}`);
    params.push(end_date);
    paramIndex++;
  }

  if (outlet_id) {
    whereConditions.push(`r.outlet_id = $${paramIndex}`);
    params.push(outlet_id);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const result = await query(`
    SELECT 
      r.*, 
      s.total_amount as original_sale_amount,
      s.payment_method,
      u.name as processed_by_name,
      CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, '')) as customer_name,
      c.phone as customer_phone
    FROM product_returns r
    LEFT JOIN sales s ON r.sale_id = s.id
    LEFT JOIN users u ON r.processed_by = u.id
    LEFT JOIN customers c ON s.customer_id = c.id
    ${whereClause}
    ORDER BY r.return_date DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `, [...params, limit, offset]);

  const countResult = await query(`
    SELECT COUNT(*) as total
    FROM product_returns r
    ${whereClause}
  `, params);

  return {
    returns: result.rows,
    total: parseInt(countResult.rows[0].total),
    page,
    limit,
    totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
  };
}

/**
 * Get return statistics
 */
export async function getReturnStats(days = 30, outlet_id = null) {
  let whereClause = `WHERE return_date >= CURRENT_DATE - INTERVAL '${days} days'`;
  let params = [];
  
  if (outlet_id) {
    whereClause += ` AND outlet_id = $1`;
    params.push(outlet_id);
  }

  const result = await query(`
    SELECT 
      COUNT(*) as total_returns,
      SUM(quantity_returned) as total_items_returned,
      SUM(refund_amount) as total_refund_amount,
      AVG(refund_amount) as avg_refund_amount,
      COUNT(DISTINCT sale_id) as unique_sales_returned
    FROM product_returns
    ${whereClause}
  `, params);
  
  let topReasonsParams = params;
  const topReasonsResult = await query(`
    SELECT 
      return_reason,
      COUNT(*) as count,
      SUM(refund_amount) as total_refund
    FROM product_returns
    ${whereClause}
    GROUP BY return_reason
    ORDER BY count DESC
    LIMIT 5
  `, topReasonsParams);

  return {
    ...result.rows[0],
    top_reasons: topReasonsResult.rows
  };
}

/**
 * Get a single return by ID
 */
export async function getReturnById(id) {
  const result = await query(`
    SELECT 
      r.*,
      s.total_amount as original_sale_amount,
      s.payment_method,
      u.name as processed_by_name,
      CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, '')) as customer_name,
      c.phone as customer_phone
    FROM product_returns r
    LEFT JOIN sales s ON r.sale_id = s.id
    LEFT JOIN users u ON r.processed_by = u.id
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE r.id = $1
  `, [id]);
  
  return result.rows[0];
}

/**
 * Check if a sale item can be returned
 */
export async function checkReturnEligibility(sale_id, product_id) {
  const saleResult = await query(`
    SELECT 
      s.quantity,
      s.total_amount,
      s.product_name,
      s.created_at,
      s.return_status,
      s.outlet_id,
      COALESCE(SUM(r.quantity_returned), 0) as already_returned
    FROM sales s
    LEFT JOIN product_returns r ON r.sale_id = s.id AND r.product_id = s.product_id
    WHERE s.id = $1 AND s.product_id = $2
    GROUP BY s.id, s.quantity, s.total_amount, s.product_name, s.created_at, s.return_status, s.outlet_id
  `, [sale_id, product_id]);

  if (saleResult.rows.length === 0) {
    return { eligible: false, reason: 'Sale not found' };
  }

  const sale = saleResult.rows[0];
  const remainingQuantity = sale.quantity - sale.already_returned;

  if (remainingQuantity <= 0) {
    return { eligible: false, reason: 'All items already returned' };
  }

  return {
    eligible: true,
    sale,
    remainingQuantity,
    maxRefundAmount: (sale.total_amount / sale.quantity) * remainingQuantity
  };
}
