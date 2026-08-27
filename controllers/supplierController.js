import { getSession, requireRoleOrThrow } from "../lib/auth"
import {
  listSuppliers,
  createSupplier,
  findSupplierById,
  findSupplierByName,
  findSupplierByEmail,
  updateSupplier,
  deleteSupplier,
  getSupplierStats,
  getSupplierProducts
} from "../models/supplierModel"
import { validateCsrf } from "../lib/csrf"
import { NextResponse } from "next/server"
import { z } from "zod"

const supplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required").max(255),
  contact_person: z.string().optional(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  payment_terms: z.string().optional(),
  payment_method: z.enum(['bank_transfer', 'check', 'cash', 'other']).optional(),
  bank_account: z.string().optional(),
  bank_name: z.string().optional(),
  supplier_type: z.enum(['wholesale', 'manufacturer', 'distributor', 'other']).optional(),
  tax_id: z.string().optional(),
  is_active: z.boolean().default(true),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional()
})

const updateSupplierSchema = supplierSchema.partial()

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
    const is_active = searchParams.get('is_active')
    const supplier_type = searchParams.get('supplier_type')

    const result = await listSuppliers({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      search,
      is_active: is_active !== null ? is_active === 'true' : undefined,
      supplier_type
    })

    return Response.json(result)
  } catch (error) {
    console.error('Error in suppliers list:', error)
    return Response.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
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
  const parsed = supplierSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid supplier data",
        details: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    )
  }

  const { name, email } = parsed.data

  try {
    // Check if supplier name already exists
    const existingSupplier = await findSupplierByName(name)
    if (existingSupplier) {
      return NextResponse.json({ error: "Supplier name already exists" }, { status: 400 })
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await findSupplierByEmail(email)
      if (existingEmail) {
        return NextResponse.json({ error: "Email already registered" }, { status: 400 })
      }
    }

    const supplier = await createSupplier({
      ...parsed.data,
      created_by: session.user_id
    })

    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
  }
}

export async function get(request, { params }) {
  const session = await getSession()

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supplier = await findSupplierById(params.id)

    if (!supplier) {
      return Response.json({ error: 'Supplier not found' }, { status: 404 })
    }

    const stats = await getSupplierStats(params.id)
    const products = await getSupplierProducts(params.id)

    return Response.json({
      ...supplier,
      stats,
      products
    })
  } catch (error) {
    console.error('Error fetching supplier:', error)
    return Response.json({ error: 'Failed to fetch supplier' }, { status: 500 })
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
  const parsed = updateSupplierSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid supplier data",
        details: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    )
  }

  try {
    const supplier = await findSupplierById(params.id)

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    // Check for name conflict if updating name
    if (parsed.data.name && parsed.data.name !== supplier.name) {
      const existing = await findSupplierByName(parsed.data.name)
      if (existing) {
        return NextResponse.json({ error: "Supplier name already exists" }, { status: 400 })
      }
    }

    // Check for email conflict if updating email
    if (parsed.data.email && parsed.data.email !== supplier.email) {
      const existing = await findSupplierByEmail(parsed.data.email)
      if (existing) {
        return NextResponse.json({ error: "Email already registered" }, { status: 400 })
      }
    }

    const updated = await updateSupplier(params.id, parsed.data)

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating supplier:', error)
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 })
  }
}

export async function deleteSupplierHandler(request, { params }) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  if (!(await validateCsrf(request.headers))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
  }

  try {
    const supplier = await findSupplierById(params.id)

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    const deleted = await deleteSupplier(params.id)

    return NextResponse.json({
      message: 'Supplier deleted successfully',
      deleted_supplier: deleted
    })
  } catch (error) {
    console.error('Error deleting supplier:', error)

    if (error.message.includes('active purchase orders')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 })
  }
}
