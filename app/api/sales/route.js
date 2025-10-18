import { createSale, listSales, getSalesStats, getDailySalesStats, getTopSellingProducts } from '../../../models/salesModel'
import { findProductById } from '../../../models/productModel'
import { findCustomerById, addPointsToCustomer } from '../../../models/customerModel'
import { findLoyaltyProgramById } from '../../../models/loyaltyProgramModel'
import { query } from '../../../lib/db'
import { getSession } from '../../../lib/auth'
import { validateCsrf } from '../../../lib/csrf'

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Validate CSRF token
    if (!(await validateCsrf(request.headers))) {
      return Response.json({ error: "Invalid CSRF token" }, { status: 403 })
    }

    const body = await request.json()
    const { 
      items, 
      subtotal, 
      reward_discount = 0,
      tax, 
      total,
      customer_id,
      reward_id,
      reward_points_used = 0
    } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ message: 'Invalid items data' }, { status: 400 })
    }

    console.log('Processing sale with:', { customer_id, reward_id, reward_points_used, total })

    // Start transaction
    await query('BEGIN')

    try {
      const sales = []
      
      // Process each item
      for (const item of items) {
        // Verify product exists and has enough stock
        const product = await findProductById(item.product_id)
        if (!product) {
          throw new Error(`Product with ID ${item.product_id} not found`)
        }

        if (product.available_quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.available_quantity}`)
        }

        // Create sale record
        const sale = await createSale({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          original_price: item.original_price,
          discount_percentage: item.discount_percentage || 0,
          discount_amount: item.discount_amount || 0,
          total_amount: item.total_amount,
          customer_id: customer_id || null,
          created_by: session.user.id
        })

        sales.push(sale)

        // Update product quantities
        await query(`
          UPDATE products 
          SET 
            available_quantity = available_quantity - $1,
            sold_quantity = sold_quantity + $1,
            updated_at = NOW()
          WHERE id = $2
        `, [item.quantity, item.product_id])
      }

      // Process reward redemption if reward was applied
      if (reward_id && customer_id && reward_points_used > 0) {
        try {
          console.log('Redeeming reward:', { reward_id, customer_id })
          
          // Get reward details
          const rewardResult = await query('SELECT * FROM rewards WHERE id = $1 AND is_active = true', [reward_id])
          const reward = rewardResult.rows[0]
          
          if (!reward) {
            throw new Error('Reward not found or inactive')
          }
          
          // Check stock quantity
          if (reward.stock_quantity !== null && reward.stock_quantity <= 0) {
            throw new Error('Reward out of stock')
          }
          
          // Get customer details
          const customerResult = await query('SELECT * FROM customers WHERE id = $1', [customer_id])
          const customer = customerResult.rows[0]
          
          if (!customer) {
            throw new Error('Customer not found')
          }
          
          // Check if customer has enough points
          if (customer.points_balance < reward.points_cost) {
            throw new Error(`Insufficient points balance. Required: ${reward.points_cost}, Available: ${customer.points_balance}`)
          }
          
          // Deduct points from customer
          await query(`
            UPDATE customers 
            SET points_balance = points_balance - $1, 
                total_points_redeemed = total_points_redeemed + $1,
                last_activity = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [reward.points_cost, customer_id])
          
          // Update stock quantity if applicable
          if (reward.stock_quantity !== null) {
            await query('UPDATE rewards SET stock_quantity = stock_quantity - 1 WHERE id = $1', [reward_id])
          }
          
          // Create redemption record
          await query(`
            INSERT INTO redemptions (customer_id, reward_id, points_used, status)
            VALUES ($1, $2, $3, 'issued')
          `, [customer_id, reward_id, reward.points_cost])
          
          // Create loyalty transaction record
          await query(`
            INSERT INTO loyalty_transactions (customer_id, points, type, description)
            VALUES ($1, $2, 'redeem', $3)
          `, [customer_id, -reward.points_cost, `Redeemed: ${reward.name}`])
          
          console.log('Reward redeemed successfully')
        } catch (rewardError) {
          console.error('Error redeeming reward:', rewardError)
          // Rollback if reward redemption fails
          await query('ROLLBACK')
          return Response.json({ 
            message: `Failed to redeem reward: ${rewardError.message}` 
          }, { status: 400 })
        }
      }

      // Process loyalty points if customer is specified
      let loyaltyPointsAwarded = 0
      if (customer_id) {
        try {
          console.log('Processing loyalty points for customer:', customer_id)
          const customer = await findCustomerById(customer_id)
          
          if (customer && customer.loyalty_program_id) {
            const program = await findLoyaltyProgramById(customer.loyalty_program_id)
            
            if (program && program.is_active) {
              // Award points based on the total after reward discount (excluding tax)
              const pointsBase = total - tax
              loyaltyPointsAwarded = Math.floor(pointsBase * program.points_per_dollar)
              
              console.log('Points calculation:', { 
                pointsBase, 
                points_per_dollar: program.points_per_dollar,
                loyaltyPointsAwarded 
              })
              
              if (loyaltyPointsAwarded > 0) {
                await addPointsToCustomer(
                  customer_id, 
                  loyaltyPointsAwarded, 
                  `Purchase - Receipt #${sales[0]?.id || 'N/A'}`,
                  sales[0]?.id
                )
                console.log(`Awarded ${loyaltyPointsAwarded} points to customer ${customer_id}`)
              }
            } else {
              console.log('Loyalty program not active or not found')
            }
          } else {
            console.log('Customer has no loyalty program')
          }
        } catch (loyaltyError) {
          console.error('Error processing loyalty points:', loyaltyError)
          // Don't fail the sale if loyalty processing fails
        }
      }

      // Commit transaction
      await query('COMMIT')

      console.log('Sale completed successfully with loyalty info:', {
        loyaltyPointsAwarded,
        reward_points_used,
        customer_id
      })

      return Response.json({
        message: 'Sales processed successfully',
        sales,
        summary: {
          subtotal,
          reward_discount,
          tax,
          total,
          items_count: items.length,
          total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
          loyalty_points_awarded: loyaltyPointsAwarded,
          loyalty_points_redeemed: reward_points_used,
          customer_id: customer_id || null
        }
      }, { status: 201 })

    } catch (error) {
      // Rollback transaction on error
      await query('ROLLBACK')
      throw error
    }

  } catch (error) {
    console.error('Sales API Error:', error)
    return Response.json({ 
      message: error.message || 'Failed to process sales' 
    }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const product_id = searchParams.get('product_id')
    const stats = searchParams.get('stats')

    if (stats === 'true') {
      const [generalStats, dailyStats, topProducts] = await Promise.all([
        getSalesStats(),
        getDailySalesStats(30),
        getTopSellingProducts(10)
      ])

      return Response.json({
        general: generalStats,
        daily: dailyStats,
        topProducts
      })
    }

    const result = await listSales({
      page,
      limit,
      start_date,
      end_date,
      product_id
    })

    return Response.json(result)

  } catch (error) {
    console.error('Sales GET API Error:', error)
    return Response.json({ 
      message: 'Failed to fetch sales data' 
    }, { status: 500 })
  }
}
