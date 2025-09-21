import { getSession, requireRoleOrThrow } from "../lib/auth.js"
import { 
  findAllRewards,
  findActiveRewards,
  findRewardById,
  createReward,
  updateReward,
  redeemReward,
  getRewardStats,
  getCustomerRedemptions
} from "../models/rewardModel.js"
import { validateCsrf } from "../lib/csrf.js"
import { NextResponse } from "next/server"

// Get all rewards
export async function listRewards(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "cashier"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  const { searchParams } = new URL(request.url)
  const activeOnly = searchParams.get('active') === 'true'

  try {
    const rewards = activeOnly ? 
      await findActiveRewards() : 
      await findAllRewards()
    return NextResponse.json({ rewards })
  } catch (error) {
    console.error('Error listing rewards:', error)
    return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 })
  }
}

// Create new reward
export async function createNewReward(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  if (!(await validateCsrf(request.headers))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
  }

  try {
    const body = await request.json()
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
    } = body

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Reward name is required' }, { status: 400 })
    }

    if (!points_cost || points_cost < 1) {
      return NextResponse.json({ error: 'Points cost must be at least 1' }, { status: 400 })
    }

    // Validate discount fields if it's a discount reward
    if (is_discount) {
      if (!discount_percentage && !discount_amount) {
        return NextResponse.json({ error: 'Either discount percentage or discount amount is required for discount rewards' }, { status: 400 })
      }
      
      if (discount_percentage && (discount_percentage < 0 || discount_percentage > 100)) {
        return NextResponse.json({ error: 'Discount percentage must be between 0 and 100' }, { status: 400 })
      }
      
      if (discount_amount && discount_amount < 0) {
        return NextResponse.json({ error: 'Discount amount cannot be negative' }, { status: 400 })
      }
    }

    if (min_purchase_amount && min_purchase_amount < 0) {
      return NextResponse.json({ error: 'Minimum purchase amount cannot be negative' }, { status: 400 })
    }

    if (stock_quantity && stock_quantity < 0) {
      return NextResponse.json({ error: 'Stock quantity cannot be negative' }, { status: 400 })
    }

    const reward = await createReward({
      name: name.trim(),
      description: description?.trim(),
      points_cost,
      is_discount: Boolean(is_discount),
      discount_percentage,
      discount_amount,
      min_purchase_amount: min_purchase_amount || 0,
      stock_quantity,
      is_active: is_active !== false
    })

    return NextResponse.json(reward, { status: 201 })
  } catch (error) {
    console.error('Error creating reward:', error)
    return NextResponse.json({ error: 'Failed to create reward' }, { status: 500 })
  }
}

// Get reward details
export async function getReward(request, { params }) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "cashier"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  const id = parseInt(params.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid reward ID" }, { status: 400 })
  }

  try {
    const reward = await findRewardById(id)
    if (!reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }
    return NextResponse.json(reward)
  } catch (error) {
    console.error('Error fetching reward:', error)
    return NextResponse.json({ error: 'Failed to fetch reward' }, { status: 500 })
  }
}

// Update reward
export async function updateRewardDetails(request, { params }) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  if (!(await validateCsrf(request.headers))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
  }

  const id = parseInt(params.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid reward ID" }, { status: 400 })
  }

  try {
    const body = await request.json()
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
    } = body

    // Check if reward exists
    const existingReward = await findRewardById(id)
    if (!existingReward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }

    // Validate fields
    if (name !== undefined && name.trim().length === 0) {
      return NextResponse.json({ error: 'Reward name cannot be empty' }, { status: 400 })
    }

    if (points_cost !== undefined && points_cost < 1) {
      return NextResponse.json({ error: 'Points cost must be at least 1' }, { status: 400 })
    }

    // Validate discount fields if it's a discount reward
    if (is_discount) {
      if (!discount_percentage && !discount_amount) {
        return NextResponse.json({ error: 'Either discount percentage or discount amount is required for discount rewards' }, { status: 400 })
      }
      
      if (discount_percentage && (discount_percentage < 0 || discount_percentage > 100)) {
        return NextResponse.json({ error: 'Discount percentage must be between 0 and 100' }, { status: 400 })
      }
      
      if (discount_amount && discount_amount < 0) {
        return NextResponse.json({ error: 'Discount amount cannot be negative' }, { status: 400 })
      }
    }

    if (min_purchase_amount !== undefined && min_purchase_amount < 0) {
      return NextResponse.json({ error: 'Minimum purchase amount cannot be negative' }, { status: 400 })
    }

    if (stock_quantity !== undefined && stock_quantity < 0) {
      return NextResponse.json({ error: 'Stock quantity cannot be negative' }, { status: 400 })
    }

    const reward = await updateReward(id, {
      name: name?.trim(),
      description: description?.trim(),
      points_cost,
      is_discount,
      discount_percentage,
      discount_amount,
      min_purchase_amount,
      stock_quantity,
      is_active
    })

    return NextResponse.json(reward)
  } catch (error) {
    console.error('Error updating reward:', error)
    return NextResponse.json({ error: 'Failed to update reward' }, { status: 500 })
  }
}

// Redeem reward for customer
export async function redeemRewardForCustomer(request, { params }) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "cashier"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  if (!(await validateCsrf(request.headers))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
  }

  const id = parseInt(params.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid reward ID" }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { customer_id } = body

    if (!customer_id || !Number.isInteger(customer_id)) {
      return NextResponse.json({ error: 'Valid customer ID is required' }, { status: 400 })
    }

    const result = await redeemReward(id, customer_id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error redeeming reward:', error)
    if (error.message.includes('not found') || error.message.includes('inactive')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    if (error.message.includes('stock') || error.message.includes('points')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to redeem reward' }, { status: 500 })
  }
}

// Get reward statistics
export async function getRewardStatistics(request, { params }) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  const id = parseInt(params.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid reward ID" }, { status: 400 })
  }

  try {
    const stats = await getRewardStats(id)
    if (!stats) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching reward stats:', error)
    return NextResponse.json({ error: 'Failed to fetch reward statistics' }, { status: 500 })
  }
}

// Get customer redemptions
export async function getCustomerRedemptionHistory(request, { params }) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "cashier"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  const customerId = parseInt(params.customerId)
  if (!Number.isInteger(customerId)) {
    return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page')) || 1
  const limit = parseInt(searchParams.get('limit')) || 20

  try {
    const result = await getCustomerRedemptions(customerId, { page, limit })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching customer redemptions:', error)
    return NextResponse.json({ error: 'Failed to fetch customer redemptions' }, { status: 500 })
  }
}
