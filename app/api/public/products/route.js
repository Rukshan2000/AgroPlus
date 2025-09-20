import { listProducts } from "../../../../models/productModel"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = Math.min(parseInt(searchParams.get('limit')) || 20, 100)
    const category = searchParams.get('category') || undefined
    const search = searchParams.get('search') || undefined
    
    // Only show active products for public view
    const result = await listProducts({ 
      page, 
      limit, 
      category, 
      search, 
      is_active: true 
    })

    // Filter out sensitive data for public view
    const publicProducts = result.products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      selling_price: product.selling_price || product.price,
      category: product.category,
      image_url: product.image_url,
      unit_type: product.unit_type,
      unit_value: product.unit_value,
      stock_quantity: product.stock_quantity,
      sku: product.sku
    }))

    return NextResponse.json({
      products: publicProducts,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      hasMore: result.hasMore
    })
  } catch (error) {
    console.error('Error in public products API:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch products' 
    }, { status: 500 })
  }
}
