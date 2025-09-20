import { getSession, requireRoleOrThrow } from "../lib/auth"
import { 
  listProducts, 
  createProduct, 
  findProductById, 
  updateProduct, 
  deleteProduct,
  findProductBySku,
  getAvailableUnits
} from "../models/productModel"
import { getActiveCategoryNames } from "../models/categoryModel"
import { validateCsrf } from "../lib/csrf"
import { NextResponse } from "next/server"
import { z } from "zod"

const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  sku: z.string().optional(),
  category: z.string().optional(),
  stock_quantity: z.number().int().min(0, "Stock quantity must be non-negative").default(0),
  is_active: z.boolean().default(true),
  image_url: z.string().url().optional().or(z.literal("")),
  unit_type: z.enum(['kg', 'g', 'l', 'ml', 'items', 'pcs', 'bags', 'bottles', 'packets']).default('kg'),
  unit_value: z.number().min(0.001, "Unit value must be positive").default(1.000)
})

const updateProductSchema = productSchema.partial()

export async function list(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "user"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page')) || 1
  const limit = Math.min(parseInt(searchParams.get('limit')) || 10, 100)
  const category = searchParams.get('category') || undefined
  const search = searchParams.get('search') || undefined
  const is_active = searchParams.get('is_active') === 'true' ? true : 
                   searchParams.get('is_active') === 'false' ? false : undefined

  const result = await listProducts({ page, limit, category, search, is_active })
  return NextResponse.json(result)
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
  const parsed = productSchema.safeParse(body)
  
  if (!parsed.success) {
    return NextResponse.json({ 
      error: "Invalid product data", 
      details: parsed.error.flatten().fieldErrors 
    }, { status: 400 })
  }

  const { sku } = parsed.data

  // Check if SKU already exists
  if (sku) {
    const existingProduct = await findProductBySku(sku)
    if (existingProduct) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 400 })
    }
  }

  try {
    const product = await createProduct({
      ...parsed.data,
      created_by: session.user.id
    })
    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}

export async function getById(request, { params }) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "user"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  const id = Number(params.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 })
  }

  const product = await findProductById(id)
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  return NextResponse.json({ product })
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

  const id = Number(params.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 })
  }

  const existingProduct = await findProductById(id)
  if (!existingProduct) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = updateProductSchema.safeParse(body)
  
  if (!parsed.success) {
    return NextResponse.json({ 
      error: "Invalid product data", 
      details: parsed.error.flatten().fieldErrors 
    }, { status: 400 })
  }

  const { sku } = parsed.data

  // Check if SKU already exists for different product
  if (sku && sku !== existingProduct.sku) {
    const existingSkuProduct = await findProductBySku(sku)
    if (existingSkuProduct && existingSkuProduct.id !== id) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 400 })
    }
  }

  try {
    const updatedProduct = await updateProduct(id, {
      ...existingProduct,
      ...parsed.data
    })
    return NextResponse.json({ product: updatedProduct })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function remove(request, { params }) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  if (!(await validateCsrf(request.headers))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
  }

  const id = Number(params.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 })
  }

  const deletedProduct = await deleteProduct(id)
  if (!deletedProduct) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  return NextResponse.json({ message: "Product deleted successfully" })
}

export async function categories() {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "user"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  const categories = await getActiveCategoryNames()
  return NextResponse.json({ categories })
}

export async function units(request) {
  const session = await getSession()
  
  // Allow access to units for any authenticated user or even without auth since it's just static data
  if (!session) {
    // Units are static data, so we can return them without authentication
    const units = getAvailableUnits()
    return NextResponse.json({ units })
  }
  
  try {
    requireRoleOrThrow(session, ["admin", "manager", "user"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  const units = getAvailableUnits()
  return NextResponse.json({ units })
}
