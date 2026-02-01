import { getSession, requireRoleOrThrow } from "../../../../../lib/auth.js"
import { validateCsrf } from "../../../../../lib/csrf.js"
import { findCustomerById } from "../../../../../models/customerModel.js"
import { query } from "../../../../../lib/db.js"
import { NextResponse } from "next/server"

// POST - Earn or redeem points (for POS use by cashiers)
export async function POST(request, { params }) {
  const session = await getSession()
  try {
    // Allow cashiers to process loyalty points during sales
    requireRoleOrThrow(session, ["admin", "manager", "cashier"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  if (!(await validateCsrf(request.headers))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
  }

  const { id } = await params
  const customerId = parseInt(id)
  if (!Number.isInteger(customerId)) {
    return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { action, points, sale_id, description, payment_value } = body

    // Validate action
    if (!action || !['earn', 'redeem'].includes(action)) {
      return NextResponse.json({ error: "Action must be 'earn' or 'redeem'" }, { status: 400 })
    }

    // Validate points
    if (typeof points !== 'number' || points <= 0) {
      return NextResponse.json({ error: 'Points must be a positive number' }, { status: 400 })
    }

    // Check if customer exists
    const customer = await findCustomerById(customerId)
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    if (action === 'earn') {
      // Add points to customer
      const desc = description || `Earned from purchase`
      
      // Update customer points balance
      const updateResult = await query(`
        UPDATE customers 
        SET points_balance = points_balance + $1, 
            total_points_earned = COALESCE(total_points_earned, 0) + $1,
            last_activity = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING points_balance
      `, [points, customerId])
      
      // Create transaction record
      await query(`
        INSERT INTO loyalty_transactions (customer_id, sale_id, points, type, description, payment_value)
        VALUES ($1, $2, $3, 'earn', $4, $5)
      `, [customerId, sale_id || null, points, desc, 0])
      
      return NextResponse.json({
        success: true,
        message: `Added ${points} points to customer`,
        new_balance: updateResult.rows[0].points_balance
      })
    } else {
      // Redeem points from customer
      // Check if customer has enough points
      if (customer.points_balance < points) {
        return NextResponse.json({ 
          error: 'Insufficient points balance',
          current_balance: customer.points_balance,
          requested: points
        }, { status: 400 })
      }

      const desc = description || `Redeemed for purchase`
      const paymentVal = payment_value || points // Default 1 point = 1 LKR
      
      // Update customer points balance
      const updateResult = await query(`
        UPDATE customers 
        SET points_balance = points_balance - $1, 
            total_points_redeemed = COALESCE(total_points_redeemed, 0) + $1,
            last_activity = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING points_balance
      `, [points, customerId])
      
      // Create transaction record with payment value
      await query(`
        INSERT INTO loyalty_transactions (customer_id, sale_id, points, type, description, payment_value)
        VALUES ($1, $2, $3, 'redeem', $4, $5)
      `, [customerId, sale_id || null, -points, desc, paymentVal])
      
      return NextResponse.json({
        success: true,
        message: `Redeemed ${points} points (LKR ${paymentVal}) from customer`,
        new_balance: updateResult.rows[0].points_balance,
        payment_value: paymentVal
      })
    }
  } catch (error) {
    console.error('Error processing loyalty points:', error)
    if (error.message === 'Insufficient points balance') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to process loyalty points' }, { status: 500 })
  }
}

// GET - Get customer points balance
export async function GET(request, { params }) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "cashier"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  const { id } = await params
  const customerId = parseInt(id)
  if (!Number.isInteger(customerId)) {
    return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 })
  }

  try {
    const customer = await findCustomerById(customerId)
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({
      customer_id: customer.id,
      name: `${customer.first_name} ${customer.last_name}`,
      points_balance: customer.points_balance || 0
    })
  } catch (error) {
    console.error('Error fetching customer points:', error)
    return NextResponse.json({ error: 'Failed to fetch customer points' }, { status: 500 })
  }
}
