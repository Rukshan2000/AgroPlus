import { getSession, requireRoleOrThrow } from "../lib/auth"
import {
  listPurchaseOrders,
  createPurchaseOrder,
  findPurchaseOrderById,
  findPurchaseOrderByNumber,
  updatePurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
  getPurchaseOrderWithItems,
  getPurchaseOrderStats
} from "../models/purchaseOrderModel"
import { findSupplierById } from "../models/supplierModel"
import { validateCsrf } from "../lib/csrf"
import { NextResponse } from "next/server"
import { z } from "zod"

const purchaseOrderItemSchema = z.object({
  product_id: z.number().positive("Product ID must be positive"),
  quantity_ordered: z.number().positive("Quantity must be greater than 0"),
  unit_cost: z.number().positive("Unit cost must be greater than 0")
})

const createPurchaseOrderSchema = z.object({
  order_number: z.string().min(1, "Order number is required").max(50),
  supplier_id: z.number().positive("Supplier ID must be positive"),
  order_date: z.string().optional(),
  expected_delivery_date: z.string().optional(),
  items: z.array(purchaseOrderItemSchema).min(1, "At least one item is required"),
  notes: z.string().optional()
})

const updatePurchaseOrderSchema = z.object({
  expected_delivery_date: z.string().optional(),
  notes: z.string().optional()
})

const receiveItemSchema = z.object({
  id: z.number().positive(),
  quantity_received: z.number().positive()
})

export async function list(request) {
  const session = await getSession()

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page')
    const limit = searchParams.get('limit')
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const supplier_id = searchParams.get('supplier_id')
    const from_date = searchParams.get('from_date')
    const to_date = searchParams.get('to_date')

    const result = await listPurchaseOrders({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      search,
      status,
      supplier_id: supplier_id ? parseInt(supplier_id) : undefined,
      from_date,
      to_date
    })

    return Response.json(result)
  } catch (error) {
    console.error('Error in purchase orders list:', error)
    return Response.json({ error: 'Failed to fetch purchase orders' }, { status: 500 })
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
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = createPurchaseOrderSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid purchase order data",
        details: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    )
  }

  try {
    // Verify supplier exists
    const supplier = await findSupplierById(parsed.data.supplier_id)
    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    }

    // Check if order number already exists
    const existingOrder = await findPurchaseOrderByNumber(parsed.data.order_number)
    if (existingOrder) {
      return NextResponse.json({ error: "Purchase order number already exists" }, { status: 400 })
    }

    const purchaseOrder = await createPurchaseOrder({
      ...parsed.data,
      order_date: parsed.data.order_date || new Date().toISOString().split('T')[0],
      created_by: session.user_id
    })

    return NextResponse.json(purchaseOrder, { status: 201 })
  } catch (error) {
    console.error('Error creating purchase order:', error)
    return NextResponse.json({ error: error.message || 'Failed to create purchase order' }, { status: 500 })
  }
}

export async function get(request, { params }) {
  const session = await getSession()

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const purchaseOrder = await getPurchaseOrderWithItems(params.id)

    if (!purchaseOrder) {
      return Response.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    return Response.json(purchaseOrder)
  } catch (error) {
    console.error('Error fetching purchase order:', error)
    return Response.json({ error: 'Failed to fetch purchase order' }, { status: 500 })
  }
}

export async function update(request, { params }) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  if (!(await validateCsrf(request.headers))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = updatePurchaseOrderSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid purchase order data",
        details: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    )
  }

  try {
    const po = await findPurchaseOrderById(params.id)

    if (!po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    if (po.status === 'cancelled') {
      return NextResponse.json({ error: 'Cannot update cancelled purchase order' }, { status: 400 })
    }

    const updated = await updatePurchaseOrder(params.id, parsed.data)

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating purchase order:', error)
    return NextResponse.json({ error: 'Failed to update purchase order' }, { status: 500 })
  }
}

export async function receive(request, { params }) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  if (!(await validateCsrf(request.headers))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const itemUpdates = z.array(receiveItemSchema).safeParse(body)

  if (!itemUpdates.success) {
    return NextResponse.json(
      {
        error: "Invalid receive data",
        details: itemUpdates.error.flatten().fieldErrors
      },
      { status: 400 }
    )
  }

  try {
    const po = await findPurchaseOrderById(params.id)

    if (!po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    const result = await receivePurchaseOrder(params.id, itemUpdates.data)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error receiving purchase order:', error)
    return NextResponse.json({ error: error.message || 'Failed to receive purchase order' }, { status: 500 })
  }
}

export async function cancel(request, { params }) {
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
    const po = await findPurchaseOrderById(params.id)

    if (!po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    const result = await cancelPurchaseOrder(params.id)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error cancelling purchase order:', error)
    return NextResponse.json({ error: error.message || 'Failed to cancel purchase order' }, { status: 500 })
  }
}

export async function stats(request, { params }) {
  const session = await getSession()

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supplier = await findSupplierById(params.id)

    if (!supplier) {
      return Response.json({ error: 'Supplier not found' }, { status: 404 })
    }

    const stats = await getPurchaseOrderStats(params.id)

    return Response.json(stats)
  } catch (error) {
    console.error('Error fetching purchase order stats:', error)
    return Response.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
