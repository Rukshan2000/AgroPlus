import { getSession, requireRoleOrThrow } from "@/lib/auth"
import { findDistributionsByOutlet } from "@/models/productDistributeModel"
import { findProductById } from "@/models/productModel"
import { NextResponse } from "next/server"

export async function GET(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "user", "cashier"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const outlet_id = parseInt(searchParams.get("outlet_id"))
    const limit = parseInt(searchParams.get("limit")) || 1000
    const is_active = searchParams.get("is_active") !== 'false'

    if (!outlet_id) {
      return NextResponse.json({ error: 'Outlet ID is required' }, { status: 400 })
    }

    // Get all distributions for this outlet
    const distributions = await findDistributionsByOutlet(outlet_id)

    if (!distributions || distributions.length === 0) {
      return NextResponse.json({ 
        products: [],
        message: 'No products distributed to this outlet'
      }, { status: 200 })
    }

    // Create a map of product_id to distributed quantity
    const distributionMap = {}
    distributions.forEach(dist => {
      if (distributionMap[dist.product_id]) {
        distributionMap[dist.product_id] += parseFloat(dist.quantity_distributed)
      } else {
        distributionMap[dist.product_id] = parseFloat(dist.quantity_distributed)
      }
    })

    // Get unique product IDs from distributions
    const productIds = Object.keys(distributionMap).map(id => parseInt(id))

    // Fetch full product details for each
    const products = await Promise.all(
      productIds.map(id => findProductById(id))
    )

    // Merge product data with distributed quantities
    const validProducts = products
      .filter(p => p !== null && (is_active ? p.is_active : true))
      .map(product => ({
        ...product,
        // Override available_quantity with outlet-specific distributed quantity
        available_quantity: distributionMap[product.id] || 0,
        // Keep original quantity for reference if needed
        total_available_quantity: product.available_quantity,
        outlet_distributed_quantity: distributionMap[product.id] || 0
      }))
      .slice(0, limit)

    return NextResponse.json({ 
      products: validProducts,
      total: validProducts.length
    }, { status: 200 })
  } catch (error) {
    console.error('Error fetching distributed products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}
