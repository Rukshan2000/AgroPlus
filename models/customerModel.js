import { query } from "../lib/db.js"

// Customer Model Functions

export async function findAllCustomersPaginated({ page = 1, limit = 20, search = '' }) {
  const offset = (page - 1) * limit
  let baseQuery = `
    SELECT c.*, lp.name as program_name 
    FROM customers c 
    LEFT JOIN loyalty_programs lp ON c.loyalty_program_id = lp.id
  `
  let countQuery = 'SELECT COUNT(*) FROM customers c'
  let conditions = []
  let params = []

  if (search) {
    conditions.push(`
      (c.first_name ILIKE $${params.length + 1} OR 
       c.last_name ILIKE $${params.length + 1} OR 
       c.email ILIKE $${params.length + 1} OR 
       c.phone ILIKE $${params.length + 1} OR
       c.loyalty_card_number ILIKE $${params.length + 1})
    `)
    params.push(`%${search}%`)
  }

  if (conditions.length > 0) {
    baseQuery += ' WHERE ' + conditions.join(' AND ')
    countQuery += ' WHERE ' + conditions.join(' AND ')
  }

  baseQuery += ` ORDER BY c.last_activity DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
  params.push(limit, offset)

  const [result, countResult] = await Promise.all([
    query(baseQuery, params),
    query(countQuery, params.slice(0, -2))
  ])

  return {
    customers: result.rows,
    total: parseInt(countResult.rows[0].count),
    page,
    totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
  }
}

export async function findCustomerById(id) {
  const result = await query(`
    SELECT c.*, lp.name as program_name 
    FROM customers c 
    LEFT JOIN loyalty_programs lp ON c.loyalty_program_id = lp.id 
    WHERE c.id = $1
  `, [id])
  return result.rows[0] || null
}

export async function findCustomerByEmail(email) {
  const result = await query(`
    SELECT c.*, lp.name as program_name 
    FROM customers c 
    LEFT JOIN loyalty_programs lp ON c.loyalty_program_id = lp.id 
    WHERE c.email = $1
  `, [email])
  return result.rows[0] || null
}

export async function findCustomerByPhone(phone) {
  const result = await query(`
    SELECT c.*, lp.name as program_name 
    FROM customers c 
    LEFT JOIN loyalty_programs lp ON c.loyalty_program_id = lp.id 
    WHERE c.phone = $1
  `, [phone])
  return result.rows[0] || null
}

export async function createCustomer(customerData) {
  const { first_name, last_name, email, phone, loyalty_program_id } = customerData
  
  // Get default loyalty program if none specified
  let programId = loyalty_program_id
  if (!programId) {
    const defaultProgram = await query(`
      SELECT id FROM loyalty_programs WHERE is_active = true ORDER BY created_at ASC LIMIT 1
    `)
    programId = defaultProgram.rows[0]?.id
  }
  
  const result = await query(`
    INSERT INTO customers (first_name, last_name, email, phone, loyalty_program_id, points_balance)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [first_name, last_name, email, phone, programId, 0])
  
  const customer = result.rows[0]
  
  // Award signup bonus if applicable
  if (programId) {
    const program = await query('SELECT signup_bonus FROM loyalty_programs WHERE id = $1', [programId])
    if (program.rows[0]?.signup_bonus > 0) {
      await addPointsToCustomer(customer.id, program.rows[0].signup_bonus, 'Signup bonus', null)
    }
  }
  
  return customer
}

export async function updateCustomer(id, customerData) {
  const { first_name, last_name, email, phone, loyalty_program_id } = customerData
  const result = await query(`
    UPDATE customers 
    SET first_name = $1, last_name = $2, email = $3, phone = $4, loyalty_program_id = $5, updated_at = CURRENT_TIMESTAMP
    WHERE id = $6
    RETURNING *
  `, [first_name, last_name, email, phone, loyalty_program_id, id])
  return result.rows[0]
}

export async function addPointsToCustomer(customerId, points, description, saleId = null) {
  const client = await query.getClient?.() // If we have a client getter, use it
  
  try {
    if (client) await client.query('BEGIN')
    
    // Update customer points balance
    const updateQuery = `
      UPDATE customers 
      SET points_balance = points_balance + $1, 
          total_points_earned = total_points_earned + $1,
          last_activity = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING points_balance
    `
    const updateResult = client ? 
      await client.query(updateQuery, [points, customerId]) :
      await query(updateQuery, [points, customerId])
    
    // Create transaction record
    const transactionQuery = `
      INSERT INTO loyalty_transactions (customer_id, sale_id, points, type, description)
      VALUES ($1, $2, $3, 'earn', $4)
      RETURNING *
    `
    const transactionResult = client ?
      await client.query(transactionQuery, [customerId, saleId, points, description]) :
      await query(transactionQuery, [customerId, saleId, points, description])
    
    if (client) await client.query('COMMIT')
    
    return {
      transaction: transactionResult.rows[0],
      newBalance: updateResult.rows[0].points_balance
    }
  } catch (error) {
    if (client) await client.query('ROLLBACK')
    throw error
  } finally {
    if (client) client.release()
  }
}

export async function redeemPointsFromCustomer(customerId, points, description, saleId = null) {
  const client = await query.getClient?.()
  
  try {
    if (client) await client.query('BEGIN')
    
    // Check if customer has enough points
    const balanceQuery = 'SELECT points_balance FROM customers WHERE id = $1'
    const balanceResult = client ?
      await client.query(balanceQuery, [customerId]) :
      await query(balanceQuery, [customerId])
    
    if (!balanceResult.rows[0] || balanceResult.rows[0].points_balance < points) {
      throw new Error('Insufficient points balance')
    }
    
    // Update customer points balance
    const updateQuery = `
      UPDATE customers 
      SET points_balance = points_balance - $1, 
          total_points_redeemed = total_points_redeemed + $1,
          last_activity = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING points_balance
    `
    const updateResult = client ?
      await client.query(updateQuery, [points, customerId]) :
      await query(updateQuery, [points, customerId])
    
    // Create transaction record
    const transactionQuery = `
      INSERT INTO loyalty_transactions (customer_id, sale_id, points, type, description)
      VALUES ($1, $2, $3, 'redeem', $4)
      RETURNING *
    `
    const transactionResult = client ?
      await client.query(transactionQuery, [customerId, saleId, -points, description]) :
      await query(transactionQuery, [customerId, saleId, -points, description])
    
    if (client) await client.query('COMMIT')
    
    return {
      transaction: transactionResult.rows[0],
      newBalance: updateResult.rows[0].points_balance
    }
  } catch (error) {
    if (client) await client.query('ROLLBACK')
    throw error
  } finally {
    if (client) client.release()
  }
}

export async function adjustCustomerPoints(customerId, points, reason, adminId) {
  const type = points > 0 ? 'adjustment' : 'redeem'
  const actualPoints = Math.abs(points)
  
  if (points > 0) {
    return await addPointsToCustomer(customerId, actualPoints, reason)
  } else {
    return await redeemPointsFromCustomer(customerId, actualPoints, reason)
  }
}

export async function getCustomerTransactions(customerId, { page = 1, limit = 20 }) {
  const offset = (page - 1) * limit
  const result = await query(`
    SELECT lt.*, s.receipt_number
    FROM loyalty_transactions lt
    LEFT JOIN sales s ON lt.sale_id = s.id
    WHERE lt.customer_id = $1
    ORDER BY lt.created_at DESC
    LIMIT $2 OFFSET $3
  `, [customerId, limit, offset])
  
  const countResult = await query(`
    SELECT COUNT(*) FROM loyalty_transactions WHERE customer_id = $1
  `, [customerId])
  
  return {
    transactions: result.rows,
    total: parseInt(countResult.rows[0].count),
    page,
    totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
  }
}

export async function searchCustomers(searchTerm) {
  const result = await query(`
    SELECT c.*, lp.name as program_name 
    FROM customers c 
    LEFT JOIN loyalty_programs lp ON c.loyalty_program_id = lp.id 
    WHERE c.first_name ILIKE $1 OR 
          c.last_name ILIKE $1 OR 
          c.email ILIKE $1 OR 
          c.phone ILIKE $1
    ORDER BY c.last_activity DESC
    LIMIT 10
  `, [`%${searchTerm}%`])
  
  return result.rows
}
