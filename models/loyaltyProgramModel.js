import { query } from "../lib/db.js"

// Loyalty Program Model Functions

export async function findAllLoyaltyPrograms() {
  const result = await query(`
    SELECT * FROM loyalty_programs 
    ORDER BY created_at DESC
  `)
  return result.rows
}

export async function findActiveLoyaltyPrograms() {
  const result = await query(`
    SELECT * FROM loyalty_programs 
    WHERE is_active = true
    ORDER BY created_at DESC
  `)
  return result.rows
}

export async function findLoyaltyProgramById(id) {
  const result = await query(`
    SELECT * FROM loyalty_programs WHERE id = $1
  `, [id])
  return result.rows[0] || null
}

export async function createLoyaltyProgram(programData) {
  const { 
    name, 
    description, 
    points_per_dollar = 1.00, 
    signup_bonus = 0, 
    min_redemption_threshold = 100,
    is_active = true 
  } = programData
  
  const result = await query(`
    INSERT INTO loyalty_programs (name, description, points_per_dollar, signup_bonus, min_redemption_threshold, is_active)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [name, description, points_per_dollar, signup_bonus, min_redemption_threshold, is_active])
  
  return result.rows[0]
}

export async function updateLoyaltyProgram(id, programData) {
  const { 
    name, 
    description, 
    points_per_dollar, 
    signup_bonus, 
    min_redemption_threshold,
    is_active 
  } = programData
  
  const result = await query(`
    UPDATE loyalty_programs 
    SET name = $1, description = $2, points_per_dollar = $3, 
        signup_bonus = $4, min_redemption_threshold = $5, is_active = $6,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $7
    RETURNING *
  `, [name, description, points_per_dollar, signup_bonus, min_redemption_threshold, is_active, id])
  
  return result.rows[0]
}

export async function getLoyaltyProgramStats(id) {
  const result = await query(`
    SELECT 
      lp.*,
      COUNT(c.id) as total_customers,
      COALESCE(SUM(c.points_balance), 0) as total_points_outstanding,
      COALESCE(SUM(c.total_points_earned), 0) as total_points_earned,
      COALESCE(SUM(c.total_points_redeemed), 0) as total_points_redeemed,
      COALESCE(AVG(c.points_balance), 0) as avg_points_per_customer
    FROM loyalty_programs lp
    LEFT JOIN customers c ON lp.id = c.loyalty_program_id
    WHERE lp.id = $1
    GROUP BY lp.id
  `, [id])
  
  const stats = result.rows[0]
  
  // Get recent activity
  const activityResult = await query(`
    SELECT 
      COUNT(*) as transaction_count,
      SUM(CASE WHEN type = 'earn' THEN points ELSE 0 END) as points_earned_last_30_days,
      SUM(CASE WHEN type = 'redeem' THEN ABS(points) ELSE 0 END) as points_redeemed_last_30_days
    FROM loyalty_transactions lt
    JOIN customers c ON lt.customer_id = c.id
    WHERE c.loyalty_program_id = $1 
    AND lt.created_at >= CURRENT_DATE - INTERVAL '30 days'
  `, [id])
  
  return {
    ...stats,
    ...activityResult.rows[0]
  }
}

export async function deactivateLoyaltyProgram(id) {
  const result = await query(`
    UPDATE loyalty_programs 
    SET is_active = false, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `, [id])
  
  return result.rows[0]
}
