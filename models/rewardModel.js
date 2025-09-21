import { query } from "../lib/db.js"

// Reward Model Functions

export async function findAllRewards() {
  const result = await query(`
    SELECT * FROM rewards 
    ORDER BY points_cost ASC
  `)
  return result.rows
}

export async function findActiveRewards() {
  const result = await query(`
    SELECT * FROM rewards 
    WHERE is_active = true
    ORDER BY points_cost ASC
  `)
  return result.rows
}

export async function findRewardById(id) {
  const result = await query(`
    SELECT * FROM rewards WHERE id = $1
  `, [id])
  return result.rows[0] || null
}

export async function createReward(rewardData) {
  const { 
    name, 
    description, 
    points_cost, 
    is_discount = false,
    discount_percentage = null,
    discount_amount = null,
    min_purchase_amount = 0,
    stock_quantity = null,
    is_active = true 
  } = rewardData
  
  const result = await query(`
    INSERT INTO rewards (
      name, description, points_cost, is_discount, discount_percentage, 
      discount_amount, min_purchase_amount, stock_quantity, is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [
    name, description, points_cost, is_discount, discount_percentage, 
    discount_amount, min_purchase_amount, stock_quantity, is_active
  ])
  
  return result.rows[0]
}

export async function updateReward(id, rewardData) {
  const { 
    name, 
    description, 
    points_cost, 
    is_discount,
    discount_percentage,
    discount_amount,
    min_purchase_amount,
    stock_quantity,
    is_active 
  } = rewardData
  
  const result = await query(`
    UPDATE rewards 
    SET name = $1, description = $2, points_cost = $3, is_discount = $4,
        discount_percentage = $5, discount_amount = $6, min_purchase_amount = $7,
        stock_quantity = $8, is_active = $9, updated_at = CURRENT_TIMESTAMP
    WHERE id = $10
    RETURNING *
  `, [
    name, description, points_cost, is_discount, discount_percentage, 
    discount_amount, min_purchase_amount, stock_quantity, is_active, id
  ])
  
  return result.rows[0]
}

export async function redeemReward(rewardId, customerId) {
  const client = await query.getClient?.()
  
  try {
    if (client) await client.query('BEGIN')
    
    // Get reward details
    const rewardQuery = 'SELECT * FROM rewards WHERE id = $1 AND is_active = true'
    const rewardResult = client ?
      await client.query(rewardQuery, [rewardId]) :
      await query(rewardQuery, [rewardId])
    
    const reward = rewardResult.rows[0]
    if (!reward) {
      throw new Error('Reward not found or inactive')
    }
    
    // Check stock quantity
    if (reward.stock_quantity !== null && reward.stock_quantity <= 0) {
      throw new Error('Reward out of stock')
    }
    
    // Get customer details
    const customerQuery = 'SELECT * FROM customers WHERE id = $1'
    const customerResult = client ?
      await client.query(customerQuery, [customerId]) :
      await query(customerQuery, [customerId])
    
    const customer = customerResult.rows[0]
    if (!customer) {
      throw new Error('Customer not found')
    }
    
    // Check if customer has enough points
    if (customer.points_balance < reward.points_cost) {
      throw new Error('Insufficient points balance')
    }
    
    // Deduct points from customer
    const updateCustomerQuery = `
      UPDATE customers 
      SET points_balance = points_balance - $1, 
          total_points_redeemed = total_points_redeemed + $1,
          last_activity = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING points_balance
    `
    const updateResult = client ?
      await client.query(updateCustomerQuery, [reward.points_cost, customerId]) :
      await query(updateCustomerQuery, [reward.points_cost, customerId])
    
    // Update stock quantity if applicable
    if (reward.stock_quantity !== null) {
      const updateStockQuery = `
        UPDATE rewards 
        SET stock_quantity = stock_quantity - 1
        WHERE id = $1
      `
      if (client) {
        await client.query(updateStockQuery, [rewardId])
      } else {
        await query(updateStockQuery, [rewardId])
      }
    }
    
    // Create redemption record
    const redemptionQuery = `
      INSERT INTO redemptions (customer_id, reward_id, points_used, status)
      VALUES ($1, $2, $3, 'issued')
      RETURNING *
    `
    const redemptionResult = client ?
      await client.query(redemptionQuery, [customerId, rewardId, reward.points_cost]) :
      await query(redemptionQuery, [customerId, rewardId, reward.points_cost])
    
    // Create loyalty transaction record
    const transactionQuery = `
      INSERT INTO loyalty_transactions (customer_id, points, type, description)
      VALUES ($1, $2, 'redeem', $3)
      RETURNING *
    `
    const transactionResult = client ?
      await client.query(transactionQuery, [customerId, -reward.points_cost, `Redeemed: ${reward.name}`]) :
      await query(transactionQuery, [customerId, -reward.points_cost, `Redeemed: ${reward.name}`])
    
    if (client) await client.query('COMMIT')
    
    return {
      redemption: redemptionResult.rows[0],
      transaction: transactionResult.rows[0],
      newBalance: updateResult.rows[0].points_balance,
      reward
    }
  } catch (error) {
    if (client) await client.query('ROLLBACK')
    throw error
  } finally {
    if (client) client.release()
  }
}

export async function findRedemptionById(id) {
  const result = await query(`
    SELECT r.*, re.name as reward_name, c.first_name, c.last_name
    FROM redemptions r
    JOIN rewards re ON r.reward_id = re.id
    JOIN customers c ON r.customer_id = c.id
    WHERE r.id = $1
  `, [id])
  return result.rows[0] || null
}

export async function markRedemptionAsUsed(redemptionId, saleId = null) {
  const result = await query(`
    UPDATE redemptions 
    SET status = 'used', sale_id = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2 AND status = 'issued'
    RETURNING *
  `, [saleId, redemptionId])
  
  return result.rows[0]
}

export async function getCustomerRedemptions(customerId, { page = 1, limit = 20 }) {
  const offset = (page - 1) * limit
  const result = await query(`
    SELECT r.*, re.name as reward_name, re.description as reward_description
    FROM redemptions r
    JOIN rewards re ON r.reward_id = re.id
    WHERE r.customer_id = $1
    ORDER BY r.created_at DESC
    LIMIT $2 OFFSET $3
  `, [customerId, limit, offset])
  
  const countResult = await query(`
    SELECT COUNT(*) FROM redemptions WHERE customer_id = $1
  `, [customerId])
  
  return {
    redemptions: result.rows,
    total: parseInt(countResult.rows[0].count),
    page,
    totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
  }
}

export async function getRewardStats(rewardId) {
  const result = await query(`
    SELECT 
      r.*,
      COUNT(re.id) as total_redemptions,
      COUNT(CASE WHEN re.status = 'issued' THEN 1 END) as pending_redemptions,
      COUNT(CASE WHEN re.status = 'used' THEN 1 END) as used_redemptions,
      COALESCE(SUM(re.points_used), 0) as total_points_redeemed
    FROM rewards r
    LEFT JOIN redemptions re ON r.id = re.reward_id
    WHERE r.id = $1
    GROUP BY r.id
  `, [rewardId])
  
  return result.rows[0]
}
