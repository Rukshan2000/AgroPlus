import { query } from "../../../../lib/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Public product listing without authentication
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = Math.min(parseInt(searchParams.get('limit')) || 20, 100)
    const category = searchParams.get('category') || undefined
    const search = searchParams.get('search') || undefined
    
    const offset = (page - 1) * limit
    let whereConditions = ['is_active = true'] // Only show active products for public
    let params = []
    let paramIndex = 1

    if (category) {
      whereConditions.push(`category = $${paramIndex}`)
      params.push(category)
      paramIndex++
    }

    if (search) {
      whereConditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`)
      params.push(`%${search}%`)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM products
      ${whereClause}
    `, params)

    // Get products with only public information
    const result = await query(`
      SELECT 
        id,
        name,
        description,
        selling_price,
        category,
        image_url,
        unit_type,
        unit_value,
        stock_quantity,
        sku
      FROM products
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset])

    const total = parseInt(countResult.rows[0].total)
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      products: result.rows,
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages
    })
  } catch (error) {
    console.error('Error in website products API:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch products',
      products: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
      hasMore: false
    }, { status: 500 })
  }
}
