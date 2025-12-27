import { getSession, requireRoleOrThrow } from "../lib/auth"
import { 
  listDistributions,
  createDistribution,
  findDistributionById,
  updateDistribution,
  deleteDistribution,
  findDistributionsByProduct,
  findDistributionsByOutlet,
  getTotalDistributedByProduct,
  getTotalDistributedByOutlet,
  getDistributionStats,
  bulkCreateDistributions
} from "../models/productDistributeModel"
import { findProductById } from "../models/productModel"
import { findOutletById } from "../models/outletModel"
import { validateCsrf } from "../lib/csrf"
import { NextResponse } from "next/server"
import { z } from "zod"

const distributionSchema = z.object({
  product_id: z.number().positive("Product is required"),
  outlet_id: z.number().positive("Outlet is required"),
  quantity_distributed: z.number().positive("Quantity must be greater than 0"),
  notes: z.string().optional().or(z.literal(''))
})

const updateDistributionSchema = distributionSchema.partial()

export async function list(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "user"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page")) || 1
    const limit = parseInt(searchParams.get("limit")) || 10
    const product_id = searchParams.get("product_id") ? parseInt(searchParams.get("product_id")) : null
    const outlet_id = searchParams.get("outlet_id") ? parseInt(searchParams.get("outlet_id")) : null
    const start_date = searchParams.get("start_date") || null
    const end_date = searchParams.get("end_date") || null

    const result = await listDistributions({
      page,
      limit,
      product_id,
      outlet_id,
      start_date,
      end_date
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Error listing distributions:', error)
    return NextResponse.json({ error: 'Failed to list distributions' }, { status: 500 })
  }
}

export async function create(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  if (!(await validateCsrf(request.headers))) {
    return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 })
  }

  try {
    const data = await request.json()
    const validated = distributionSchema.parse(data)

    // Verify product exists
    const product = await findProductById(validated.product_id)
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Verify outlet exists
    const outlet = await findOutletById(validated.outlet_id)
    if (!outlet) {
      return NextResponse.json(
        { error: 'Outlet not found' },
        { status: 404 }
      )
    }

    // Check if product has sufficient quantity
    if (product.available_quantity < validated.quantity_distributed) {
      return NextResponse.json(
        { error: `Insufficient stock. Available: ${product.available_quantity}, Requested: ${validated.quantity_distributed}` },
        { status: 400 }
      )
    }

    const distribution = await createDistribution({
      ...validated,
      distributed_by: session.user.email,
      notes: validated.notes || null
    })

    return NextResponse.json(distribution, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating distribution:', error)
    return NextResponse.json({ error: 'Failed to create distribution' }, { status: 500 })
  }
}

export async function read(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "user"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get("id"))

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const distribution = await findDistributionById(id)

    if (!distribution) {
      return NextResponse.json({ error: 'Distribution not found' }, { status: 404 })
    }

    return NextResponse.json(distribution, { status: 200 })
  } catch (error) {
    console.error('Error reading distribution:', error)
    return NextResponse.json({ error: 'Failed to read distribution' }, { status: 500 })
  }
}

export async function update(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  if (!(await validateCsrf(request.headers))) {
    return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get("id"))

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const data = await request.json()
    const validated = updateDistributionSchema.parse(data)

    const distribution = await updateDistribution(id, validated)

    if (!distribution) {
      return NextResponse.json({ error: 'Distribution not found' }, { status: 404 })
    }

    return NextResponse.json(distribution, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating distribution:', error)
    return NextResponse.json({ error: 'Failed to update distribution' }, { status: 500 })
  }
}

export async function remove(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  if (!(await validateCsrf(request.headers))) {
    return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get("id"))

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const success = await deleteDistribution(id)

    if (!success) {
      return NextResponse.json({ error: 'Distribution not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting distribution:', error)
    return NextResponse.json({ error: 'Failed to delete distribution' }, { status: 500 })
  }
}

export async function getByProduct(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "user"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const product_id = parseInt(searchParams.get("product_id"))

    if (!product_id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const distributions = await findDistributionsByProduct(product_id)

    return NextResponse.json({ distributions }, { status: 200 })
  } catch (error) {
    console.error('Error getting distributions by product:', error)
    return NextResponse.json({ error: 'Failed to get distributions' }, { status: 500 })
  }
}

export async function getByOutlet(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "user"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const outlet_id = parseInt(searchParams.get("outlet_id"))

    if (!outlet_id) {
      return NextResponse.json({ error: 'Outlet ID is required' }, { status: 400 })
    }

    const distributions = await findDistributionsByOutlet(outlet_id)

    return NextResponse.json({ distributions }, { status: 200 })
  } catch (error) {
    console.error('Error getting distributions by outlet:', error)
    return NextResponse.json({ error: 'Failed to get distributions' }, { status: 500 })
  }
}

export async function getStats(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const start_date = searchParams.get("start_date")
    const end_date = searchParams.get("end_date")

    if (!start_date || !end_date) {
      return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 })
    }

    const stats = await getDistributionStats(start_date, end_date)

    return NextResponse.json(stats, { status: 200 })
  } catch (error) {
    console.error('Error getting distribution stats:', error)
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 })
  }
}

export async function getTotalByProduct(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "user"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const product_id = parseInt(searchParams.get("product_id"))

    if (!product_id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const totals = await getTotalDistributedByProduct(product_id)

    return NextResponse.json({ totals }, { status: 200 })
  } catch (error) {
    console.error('Error getting totals:', error)
    return NextResponse.json({ error: 'Failed to get totals' }, { status: 500 })
  }
}

export async function getTotalByOutlet(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "user"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const outlet_id = parseInt(searchParams.get("outlet_id"))

    if (!outlet_id) {
      return NextResponse.json({ error: 'Outlet ID is required' }, { status: 400 })
    }

    const totals = await getTotalDistributedByOutlet(outlet_id)

    return NextResponse.json({ totals }, { status: 200 })
  } catch (error) {
    console.error('Error getting totals:', error)
    return NextResponse.json({ error: 'Failed to get totals' }, { status: 500 })
  }
}
