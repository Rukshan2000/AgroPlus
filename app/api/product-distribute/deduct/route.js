import { deductDistributionQuantity } from '../../../../models/productDistributeModel'
import { getSession } from '../../../../lib/auth'

/**
 * Deduct quantity from product distribution for a specific outlet
 * POST /api/product-distribute/deduct
 * 
 * Body: {
 *   product_id: number,
 *   outlet_id: number,
 *   quantity: number
 * }
 */
export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Allow admin/manager/cashier to deduct
    if (!['admin', 'manager', 'cashier'].includes(session.user.role)) {
      return Response.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { product_id, outlet_id, quantity } = await request.json()

    // Validate inputs
    if (!product_id || !outlet_id || !quantity) {
      return Response.json(
        { message: 'Missing required fields: product_id, outlet_id, quantity' },
        { status: 400 }
      )
    }

    if (quantity <= 0) {
      return Response.json(
        { message: 'Quantity must be greater than 0' },
        { status: 400 }
      )
    }

    // Deduct the quantity
    const result = await deductDistributionQuantity(product_id, outlet_id, quantity)

    return Response.json({
      message: 'Distribution quantity deducted successfully',
      data: result,
      status: 200
    })
  } catch (error) {
    console.error('Error deducting distribution quantity:', error)
    return Response.json(
      {
        message: error.message || 'Failed to deduct distribution quantity',
        error: error.message
      },
      { status: error.message?.includes('not found') || error.message?.includes('Insufficient') ? 400 : 500 }
    )
  }
}

/**
 * Get available quantity for a product at an outlet
 * GET /api/product-distribute/deduct?product_id=1&outlet_id=2
 */
export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const product_id = searchParams.get('product_id')
    const outlet_id = searchParams.get('outlet_id')

    if (!product_id || !outlet_id) {
      return Response.json(
        { message: 'Missing required query parameters: product_id, outlet_id' },
        { status: 400 }
      )
    }

    const { query } = await import('../../../../lib/db')

    const result = await query(`
      SELECT 
        id,
        product_id,
        outlet_id,
        quantity_distributed,
        available_quantity,
        distribution_date,
        is_active
      FROM product_distribute
      WHERE product_id = $1 AND outlet_id = $2 AND is_active = true
      LIMIT 1
    `, [product_id, outlet_id])

    if (!result.rows[0]) {
      return Response.json(
        { message: 'No distribution found for this product and outlet' },
        { status: 404 }
      )
    }

    return Response.json({
      message: 'Distribution found',
      data: result.rows[0]
    })
  } catch (error) {
    console.error('Error fetching distribution quantity:', error)
    return Response.json(
      { message: 'Failed to fetch distribution quantity' },
      { status: 500 }
    )
  }
}
