import { getSession, requireRoleOrThrow } from "../lib/auth"
import { 
  listCategories, 
  createCategory, 
  findCategoryById, 
  updateCategory, 
  deleteCategory,
  findCategoryByName,
  getActiveCategoryNames,
  getCategoryUsageCount
} from "../models/categoryModel"
import { validateCsrf } from "../lib/csrf"
import { NextResponse } from "next/server"
import { z } from "zod"

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(255),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Color must be a valid hex code (e.g., #FF5733)").optional(),
  is_active: z.boolean().default(true)
})

const updateCategorySchema = categorySchema.partial()

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
    
    const result = await listCategories({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      search,
      is_active: is_active !== null ? is_active === 'true' : undefined
    })
    return Response.json(result)
  } catch (error) {
    console.error('Error in categories list:', error)
    return Response.json({ error: 'Failed to fetch categories' }, { status: 500 })
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
  const parsed = categorySchema.safeParse(body)
  
  if (!parsed.success) {
    return NextResponse.json({ 
      error: "Invalid category data", 
      details: parsed.error.flatten().fieldErrors 
    }, { status: 400 })
  }

  const { name } = parsed.data

  // Check if category name already exists
  const existingCategory = await findCategoryByName(name)
  if (existingCategory) {
    return NextResponse.json({ error: "Category name already exists" }, { status: 400 })
  }

  try {
    const category = await createCategory({
      ...parsed.data,
      created_by: session.user.id
    })
    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
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
    return NextResponse.json({ error: "Invalid category id" }, { status: 400 })
  }

  const category = await findCategoryById(id)
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 })
  }

  // Get usage count
  const usageCount = await getCategoryUsageCount(id)
  
  return NextResponse.json({ 
    category: {
      ...category,
      usage_count: usageCount
    }
  })
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
    return NextResponse.json({ error: "Invalid category id" }, { status: 400 })
  }

  const existingCategory = await findCategoryById(id)
  if (!existingCategory) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = updateCategorySchema.safeParse(body)
  
  if (!parsed.success) {
    return NextResponse.json({ 
      error: "Invalid category data", 
      details: parsed.error.flatten().fieldErrors 
    }, { status: 400 })
  }

  const { name } = parsed.data

  // Check if category name already exists for different category
  if (name && name !== existingCategory.name) {
    const existingNameCategory = await findCategoryByName(name)
    if (existingNameCategory && existingNameCategory.id !== id) {
      return NextResponse.json({ error: "Category name already exists" }, { status: 400 })
    }
  }

  try {
    const updatedCategory = await updateCategory(id, {
      ...existingCategory,
      ...parsed.data
    })
    return NextResponse.json({ category: updatedCategory })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
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
    return NextResponse.json({ error: "Invalid category id" }, { status: 400 })
  }

  // Check if category is being used by any products
  const usageCount = await getCategoryUsageCount(id)
  if (usageCount > 0) {
    return NextResponse.json({ 
      error: `Cannot delete category. It is currently used by ${usageCount} product(s).` 
    }, { status: 400 })
  }

  const deletedCategory = await deleteCategory(id)
  if (!deletedCategory) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 })
  }

  return NextResponse.json({ message: "Category deleted successfully" })
}

export async function activeNames() {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "user"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  const categoryNames = await getActiveCategoryNames()
  return NextResponse.json({ categories: categoryNames })
}
