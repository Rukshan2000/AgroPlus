import { getSession, requireRoleOrThrow } from "../lib/auth"
import { 
  listProducts, 
  createProduct, 
  findProductById, 
  updateProduct, 
  deleteProduct,
  findProductBySku,
  getAvailableUnits,
  restockProduct,
  getRestockHistory,
  getProductsWithAlerts,
  getProductsExpiringSoon,
  bulkCreateProducts,
  getAllProductsForExport,
  bulkDeleteProducts
} from "../models/productModel"
import { getActiveCategoryNames } from "../models/categoryModel"
import { validateCsrf } from "../lib/csrf"
import { NextResponse } from "next/server"
import { z } from "zod"

const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive").optional(), // Keep for backward compatibility
  buying_price: z.number().min(0, "Buying price must be positive").default(0),
  selling_price: z.number().min(0, "Selling price must be positive"),
  sku: z.string().optional(),
  category: z.string().optional(),
  stock_quantity: z.number().int().min(0, "Stock quantity must be non-negative").default(0),
  is_active: z.boolean().default(true),
  image_url: z.string().url().optional().or(z.literal("")),
  unit_type: z.enum(['kg', 'g', 'l', 'ml', 'items', 'pcs', 'bags', 'bottles', 'packets']).default('kg'),
  unit_value: z.number().min(0.001, "Unit value must be positive").default(1.000),
  expiry_date: z.string().optional().or(z.literal("")).nullable(),
  manufacture_date: z.string().optional().or(z.literal("")).nullable(),
  alert_before_days: z.number().int().min(1, "Alert days must be positive").default(7),
  minimum_quantity: z.number().int().min(0, "Minimum quantity must be non-negative").default(5)
})

const updateProductSchema = productSchema.partial()

const restockSchema = z.object({
  quantity_added: z.number().int().min(1, "Quantity to add must be positive"),
  expiry_date: z.string().optional().or(z.literal("")).nullable(),
  manufacture_date: z.string().optional().or(z.literal("")).nullable(),
  notes: z.string().optional().or(z.literal("")).nullable()
})

export async function list(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "user", "cashier"])
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

  const resolvedParams = await params
  const id = Number(resolvedParams.id)
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

  const resolvedParams = await params
  const id = Number(resolvedParams.id)
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

  const resolvedParams = await params
  const id = Number(resolvedParams.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 })
  }

  const deletedProduct = await deleteProduct(id)
  if (!deletedProduct) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  return NextResponse.json({ message: "Product deleted successfully" })
}

export async function bulkDelete(request) {
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
    const body = await request.json().catch(() => ({}))
    const { product_ids } = body

    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return NextResponse.json({ 
        error: "Invalid request. product_ids array is required." 
      }, { status: 400 })
    }

    // Validate all IDs are integers
    const validIds = product_ids.filter(id => Number.isInteger(Number(id))).map(id => Number(id))
    
    if (validIds.length === 0) {
      return NextResponse.json({ 
        error: "No valid product IDs provided" 
      }, { status: 400 })
    }

    const results = await bulkDeleteProducts(validIds)

    return NextResponse.json({
      message: `Successfully deleted ${results.deleted.length} products`,
      deletedCount: results.deleted.length,
      failedCount: results.failed.length,
      deleted: results.deleted.map(p => p.id),
      failed: results.failed
    })
  } catch (error) {
    console.error("Bulk delete error:", error)
    return NextResponse.json({ 
      error: "Failed to delete products" 
    }, { status: 500 })
  }
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

// Restock product endpoint
export async function restock(request, { params }) {
  console.log("🔄 Restock API called with params:", params)
  
  const session = await getSession()
  console.log("👤 Session retrieved:", session?.user?.id)
  
  try {
    requireRoleOrThrow(session, ["admin", "manager"])
    console.log("✅ Role validation passed")
  } catch (e) {
    console.log("❌ Role validation failed:", e.message)
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  if (!await validateCsrf(request.headers)) {
    console.log("❌ CSRF validation failed")
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
  }
  console.log("✅ CSRF validation passed")

  const resolvedParams = await params
  const id = parseInt(resolvedParams.id)
  if (!Number.isInteger(id)) {
    console.log("❌ Invalid product ID:", resolvedParams.id)
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 })
  }
  console.log("✅ Product ID validated:", id)

  try {
    const body = await request.json()
    console.log("📦 Request body parsed:", body)
    
    const validatedData = restockSchema.parse(body)
    console.log("✅ Data validation passed:", validatedData)

    // Convert empty strings to null for dates
    const expiry_date = validatedData.expiry_date === "" ? null : validatedData.expiry_date
    const manufacture_date = validatedData.manufacture_date === "" ? null : validatedData.manufacture_date

    const restockParams = {
      product_id: id,
      quantity_added: validatedData.quantity_added,
      expiry_date,
      manufacture_date,
      notes: validatedData.notes,
      restocked_by: session.user.id
    }
    console.log("🔧 Calling restockProduct with params:", restockParams)

    const result = await restockProduct(restockParams)
    console.log("✅ Restock operation completed:", result)

    return NextResponse.json({
      message: "Product restocked successfully",
      ...result
    })
  } catch (error) {
    console.error("💥 Restock error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
    
    if (error.name === 'ZodError') {
      console.log("❌ Validation error details:", error.errors)
      return NextResponse.json({ 
        error: "Validation failed", 
        details: error.errors 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: error.message || "Failed to restock product" 
    }, { status: 500 })
  }
}

// Get restock history for a product
export async function restockHistory(request, { params }) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "user"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  const resolvedParams = await params
  const id = parseInt(resolvedParams.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit')) || 50, 200)

  try {
    const history = await getRestockHistory(id, limit)
    return NextResponse.json({ history })
  } catch (error) {
    console.error("Get restock history error:", error)
    return NextResponse.json({ 
      error: "Failed to fetch restock history" 
    }, { status: 500 })
  }
}

// Get products with alerts (expiry and low stock)
export async function alerts(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "user"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  try {
    const alerts = await getProductsWithAlerts()
    return NextResponse.json({ alerts })
  } catch (error) {
    console.error("Get alerts error:", error)
    return NextResponse.json({ 
      error: "Failed to fetch product alerts" 
    }, { status: 500 })
  }
}

// Get products expiring soon
export async function expiringProducts(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "user"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  const { searchParams } = new URL(request.url)
  const days_ahead = parseInt(searchParams.get('days')) || 7

  try {
    const products = await getProductsExpiringSoon(days_ahead)
    return NextResponse.json({ products })
  } catch (error) {
    console.error("Get expiring products error:", error)
    return NextResponse.json({ 
      error: "Failed to fetch expiring products" 
    }, { status: 500 })
  }
}

// Import products from CSV
export async function importCsv(request) {
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
    const body = await request.json().catch(() => ({}))
    const { products } = body

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ 
        error: "Invalid CSV data. Products array is required." 
      }, { status: 400 })
    }

    // Validate and parse each product
    const parsedProducts = []
    const validationErrors = []

    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      const rowNum = i + 2 // +2 because CSV has header row and is 1-indexed

      try {
        // Parse price variations from flat columns (variant_1_name, variant_1_price, etc.)
        const priceVariations = []
        
        for (let varNum = 1; varNum <= 5; varNum++) {
          const variantName = product[`variant_${varNum}_name`]?.trim()
          const variantPrice = product[`variant_${varNum}_price`]
          
          // If variant name exists, create the variation
          if (variantName) {
            const variation = {
              variant_name: variantName,
              price: parseFloat(variantPrice) || 0,
              buying_price: parseFloat(product[`variant_${varNum}_buying_price`]) || 0,
              stock_quantity: parseInt(product[`variant_${varNum}_stock`]) || 0,
              sku_suffix: product[`variant_${varNum}_sku_suffix`]?.trim() || null,
              description: null,
              sort_order: varNum - 1,
              is_default: (product[`variant_${varNum}_is_default`]?.toLowerCase() === 'yes' || 
                          product[`variant_${varNum}_is_default`]?.toLowerCase() === 'true' ||
                          product[`variant_${varNum}_is_default`] === '1'),
              is_active: true
            }
            
            priceVariations.push(variation)
          }
        }
        
        // If no variations have is_default set, make the first one default
        if (priceVariations.length > 0 && !priceVariations.some(v => v.is_default)) {
          priceVariations[0].is_default = true
        }

        const parsed = productSchema.safeParse({
          name: product.name?.trim(),
          description: product.description?.trim() || "",
          buying_price: parseFloat(product.buying_price) || 0,
          selling_price: parseFloat(product.selling_price) || parseFloat(product.price) || 0,
          sku: product.sku?.trim() || "",
          category: product.category?.trim() || "",
          stock_quantity: parseInt(product.stock_quantity) || 0,
          is_active: product.is_active === 'true' || product.is_active === true || product.is_active === '1' || product.is_active === 1,
          image_url: product.image_url?.trim() || "",
          unit_type: product.unit_type?.trim() || 'kg',
          unit_value: parseFloat(product.unit_value) || 1.0,
          minimum_quantity: parseInt(product.minimum_quantity) || 5,
          alert_before_days: parseInt(product.alert_before_days) || 7,
          expiry_date: product.expiry_date?.trim() || null,
          manufacture_date: product.manufacture_date?.trim() || null
        })

        if (!parsed.success) {
          validationErrors.push({
            row: rowNum,
            product: product.name || 'Unknown',
            errors: parsed.error.flatten().fieldErrors
          })
        } else {
          // Add price variations to the parsed product
          parsedProducts.push({
            ...parsed.data,
            price_variations: priceVariations
          })
        }
      } catch (err) {
        validationErrors.push({
          row: rowNum,
          product: product.name || 'Unknown',
          errors: err.message
        })
      }
    }

    // If there are validation errors, return them
    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: "Validation errors found in CSV",
        validationErrors,
        successCount: 0,
        failedCount: validationErrors.length
      }, { status: 400 })
    }

    // Bulk create products
    const results = await bulkCreateProducts(parsedProducts, session.user.id)

    return NextResponse.json({
      message: `Successfully imported ${results.success.length} products`,
      successCount: results.success.length,
      failedCount: results.failed.length,
      failed: results.failed,
      success: results.success
    })
  } catch (error) {
    console.error("Import CSV error:", error)
    return NextResponse.json({ 
      error: "Failed to import products from CSV" 
    }, { status: 500 })
  }
}

// Export products to CSV
export async function exportCsv(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "user"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  try {
    const products = await getAllProductsForExport()
    
    // Format products for CSV export with flattened price variations
    const csvData = products.map(product => {
      const row = {
        name: product.name,
        description: product.description || '',
        sku: product.sku || '',
        category: product.category || '',
        buying_price: product.buying_price || 0,
        selling_price: product.selling_price || product.price || 0,
        price: product.price || product.selling_price || 0,
        stock_quantity: product.stock_quantity || 0,
        unit_type: product.unit_type || 'kg',
        unit_value: product.unit_value || 1.0,
        minimum_quantity: product.minimum_quantity || 5,
        alert_before_days: product.alert_before_days || 7,
        expiry_date: product.expiry_date || '',
        manufacture_date: product.manufacture_date || '',
        is_active: product.is_active ? 'true' : 'false',
        image_url: product.image_url || ''
      }

      // Add up to 5 price variations as flat columns
      for (let i = 0; i < 5; i++) {
        const variation = product.price_variations[i]
        const num = i + 1
        
        if (variation) {
          row[`variant_${num}_name`] = variation.variant_name || ''
          row[`variant_${num}_price`] = variation.price || ''
          row[`variant_${num}_buying_price`] = variation.buying_price || ''
          row[`variant_${num}_stock`] = variation.stock_quantity || ''
          row[`variant_${num}_sku_suffix`] = variation.sku_suffix || ''
          row[`variant_${num}_is_default`] = variation.is_default ? 'yes' : ''
        } else {
          row[`variant_${num}_name`] = ''
          row[`variant_${num}_price`] = ''
          row[`variant_${num}_buying_price`] = ''
          row[`variant_${num}_stock`] = ''
          row[`variant_${num}_sku_suffix`] = ''
          row[`variant_${num}_is_default`] = ''
        }
      }

      return row
    })

    return NextResponse.json({ products: csvData })
  } catch (error) {
    console.error("Export CSV error:", error)
    return NextResponse.json({ 
      error: "Failed to export products to CSV" 
    }, { status: 500 })
  }
}

