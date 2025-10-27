import { createSale, listSales, getSalesStats, getDailySalesStats, getTopSellingProducts } from '../../../models/salesModel'
import { findProductById } from '../../../models/productModel'
import { query } from '../../../lib/db'
import { getSession } from '../../../lib/auth'

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { items, subtotal, tax, total, payment_method = 'cash', amount_paid, change_given = 0 } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ message: 'Invalid items data' }, { status: 400 })
    }

    // Validate payment details
    if (payment_method === 'cash') {
      if (!amount_paid || amount_paid < total) {
        return Response.json({ message: 'Insufficient payment amount' }, { status: 400 })
      }
    } else if (payment_method === 'card') {
      // For card payments, amount_paid should equal total
      if (!amount_paid) {
        return Response.json({ message: 'Payment amount required' }, { status: 400 })
      }
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
          payment_method,
          amount_paid: amount_paid / items.length, // Distribute payment across items
          change_given: change_given / items.length, // Distribute change across items
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

      // Commit transaction
      await query('COMMIT')

      return Response.json({
        message: 'Sales processed successfully',
        sales,
        summary: {
          subtotal,
          tax,
          total,
          items_count: items.length,
          total_quantity: items.reduce((sum, item) => sum + item.quantity, 0)
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
