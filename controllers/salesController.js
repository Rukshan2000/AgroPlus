import { 
  createSale, 
  listSales, 
  getSaleById, 
  getSalesStats, 
  getDailySalesStats, 
  getTopSellingProducts 
} from '../models/salesModel'
import { findProductById } from '../models/productModel'
import { findCustomerById, addPointsToCustomer } from '../models/customerModel'
import { findLoyaltyProgramById } from '../models/loyaltyProgramModel'
import { markRedemptionAsUsed } from '../models/rewardModel'
import { query } from '../lib/db'

export class SalesController {
  // Process a new sale transaction
  static async processSale(saleData, userId) {
    const { 
      items, 
      subtotal, 
      reward_discount = 0,
      tax, 
      total, 
      customer_id, 
      reward_id,
      reward_points_used = 0,
      redemption_ids = [] 
    } = saleData

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Invalid items data')
    }

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
          created_by: userId
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
          const { redeemReward } = await import('../models/rewardModel.js')
          const redemptionResult = await redeemReward(reward_id, customer_id)
          // Store redemption info for receipt
          saleData.redemption_info = redemptionResult
        } catch (rewardError) {
          console.error('Error redeeming reward:', rewardError)
          // Rollback if reward redemption fails
          throw new Error(`Failed to redeem reward: ${rewardError.message}`)
        }
      }

      // Process loyalty points if customer is specified
      let loyaltyPointsAwarded = 0
      if (customer_id) {
        try {
          const customer = await findCustomerById(customer_id)
          if (customer && customer.loyalty_program_id) {
            const program = await findLoyaltyProgramById(customer.loyalty_program_id)
            if (program && program.is_active) {
              // Award points based on the total after reward discount
              const pointsBase = total - tax // Don't award points on tax
              loyaltyPointsAwarded = Math.floor(pointsBase * program.points_per_dollar)
              if (loyaltyPointsAwarded > 0) {
                await addPointsToCustomer(
                  customer_id, 
                  loyaltyPointsAwarded, 
                  `Purchase - Receipt ${sales[0]?.id || 'N/A'}`,
                  sales[0]?.id
                )
              }
            }
          }
        } catch (loyaltyError) {
          console.error('Error processing loyalty points:', loyaltyError)
          // Don't fail the sale if loyalty processing fails
        }
      }

      // Mark redemptions as used if any were applied
      if (redemption_ids && redemption_ids.length > 0) {
        try {
          for (const redemptionId of redemption_ids) {
            await markRedemptionAsUsed(redemptionId, sales[0]?.id)
          }
        } catch (redemptionError) {
          console.error('Error marking redemptions as used:', redemptionError)
          // Don't fail the sale if redemption marking fails
        }
      }

      // Commit transaction
      await query('COMMIT')

      return {
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
      }

    } catch (error) {
      // Rollback transaction on error
      await query('ROLLBACK')
      throw error
    }
  }

  // Get sales list with filters
  static async getSales(filters = {}) {
    return await listSales(filters)
  }

  // Get single sale by ID
  static async getSaleById(id) {
    return await getSaleById(id)
  }

  // Get sales statistics
  static async getStats() {
    const [generalStats, dailyStats, topProducts] = await Promise.all([
      getSalesStats(),
      getDailySalesStats(30),
      getTopSellingProducts(10)
    ])

    return {
      general: generalStats,
      daily: dailyStats,
      topProducts
    }
  }

  // Get daily sales stats for a specific period
  static async getDailyStats(days = 30) {
    return await getDailySalesStats(days)
  }

  // Get top selling products
  static async getTopProducts(limit = 10) {
    return await getTopSellingProducts(limit)
  }

  // Validate sale data
  static validateSaleData(saleData) {
    const { items, subtotal, tax, total } = saleData
    const errors = []

    if (!items || !Array.isArray(items) || items.length === 0) {
      errors.push('Items array is required and must not be empty')
    }

    if (typeof subtotal !== 'number' || subtotal < 0) {
      errors.push('Subtotal must be a positive number')
    }

    if (typeof tax !== 'number' || tax < 0) {
      errors.push('Tax must be a positive number')
    }

    if (typeof total !== 'number' || total < 0) {
      errors.push('Total must be a positive number')
    }

    // Validate each item
    items?.forEach((item, index) => {
      if (!item.product_id) {
        errors.push(`Item ${index + 1}: Product ID is required`)
      }

      if (!item.product_name || typeof item.product_name !== 'string') {
        errors.push(`Item ${index + 1}: Product name is required`)
      }

      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`)
      }

      if (typeof item.unit_price !== 'number' || item.unit_price < 0) {
        errors.push(`Item ${index + 1}: Unit price must be a positive number`)
      }

      if (typeof item.original_price !== 'number' || item.original_price < 0) {
        errors.push(`Item ${index + 1}: Original price must be a positive number`)
      }

      if (typeof item.total_amount !== 'number' || item.total_amount < 0) {
        errors.push(`Item ${index + 1}: Total amount must be a positive number`)
      }
    })

    return errors
  }
}
