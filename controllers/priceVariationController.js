import { getSession, requireRoleOrThrow } from "../lib/auth"
import { 
  findPriceVariationsByProductId,
  findPriceVariationById,
  createPriceVariation,
  updatePriceVariation,
  deletePriceVariation,
  getDefaultPriceVariation,
  getActivePriceVariations,
  bulkCreatePriceVariations
} from "../models/priceVariationModel"
import { findProductById } from "../models/productModel"
import { validateCsrf } from "../lib/csrf"
import { NextResponse } from "next/server"
import { z } from "zod"

const priceVariationSchema = z.object({
  variant_name: z.string().min(1, "Variant name is required").max(255),
  price: z.number().min(0, "Price must be positive"),
  buying_price: z.number().min(0, "Buying price must be positive").default(0),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
  stock_quantity: z.number().int().min(0, "Stock quantity must be non-negative").default(0),
  sku_suffix: z.string().max(50).optional().nullable(),
  description: z.string().optional().nullable(),
  sort_order: z.number().int().min(0).default(0)
})

const updatePriceVariationSchema = priceVariationSchema.partial()

const bulkCreateSchema = z.object({
  variations: z.array(priceVariationSchema).min(1, "At least one variation is required")
})

/**
 * List all price variations for a product
 */
export async function listByProduct(request, productId) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "user", "cashier"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  try {
    // Verify product exists
    const product = await findProductById(productId)
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const variations = await findPriceVariationsByProductId(productId)
    return NextResponse.json({ variations })
  } catch (error) {
    console.error("Error listing price variations:", error)
    return NextResponse.json(
      { error: "Failed to list price variations" },
      { status: 500 }
    )
  }
}

/**
 * Get a specific price variation
 */
export async function getById(request, variationId) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "user", "cashier"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  try {
    const variation = await findPriceVariationById(variationId)
    if (!variation) {
      return NextResponse.json({ error: "Price variation not found" }, { status: 404 })
    }

    return NextResponse.json({ variation })
  } catch (error) {
    console.error("Error getting price variation:", error)
    return NextResponse.json(
      { error: "Failed to get price variation" },
      { status: 500 }
    )
  }
}

/**
 * Create a new price variation for a product
 */
export async function create(request, productId) {
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
    // Verify product exists
    const product = await findProductById(productId)
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = priceVariationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({
        error: "Invalid price variation data",
        details: parsed.error.flatten().fieldErrors
      }, { status: 400 })
    }

    const variation = await createPriceVariation({
      product_id: productId,
      ...parsed.data,
      created_by: session.userId
    })

    return NextResponse.json({ 
      variation,
      message: "Price variation created successfully"
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating price variation:", error)
    return NextResponse.json(
      { error: "Failed to create price variation" },
      { status: 500 }
    )
  }
}

/**
 * Bulk create price variations for a product
 */
export async function bulkCreate(request, productId) {
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
    // Verify product exists
    const product = await findProductById(productId)
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = bulkCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({
        error: "Invalid variations data",
        details: parsed.error.flatten().fieldErrors
      }, { status: 400 })
    }

    const variations = await bulkCreatePriceVariations(
      productId,
      parsed.data.variations,
      session.userId
    )

    return NextResponse.json({ 
      variations,
      message: `${variations.length} price variation(s) created successfully`
    }, { status: 201 })
  } catch (error) {
    console.error("Error bulk creating price variations:", error)
    return NextResponse.json(
      { error: "Failed to create price variations" },
      { status: 500 }
    )
  }
}

/**
 * Update a price variation
 */
export async function update(request, variationId) {
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
    // Verify variation exists
    const existingVariation = await findPriceVariationById(variationId)
    if (!existingVariation) {
      return NextResponse.json({ error: "Price variation not found" }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = updatePriceVariationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({
        error: "Invalid price variation data",
        details: parsed.error.flatten().fieldErrors
      }, { status: 400 })
    }

    const variation = await updatePriceVariation(variationId, parsed.data)

    return NextResponse.json({ 
      variation,
      message: "Price variation updated successfully"
    })
  } catch (error) {
    console.error("Error updating price variation:", error)
    return NextResponse.json(
      { error: "Failed to update price variation" },
      { status: 500 }
    )
  }
}

/**
 * Delete a price variation
 */
export async function remove(request, variationId) {
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
    const variation = await findPriceVariationById(variationId)
    if (!variation) {
      return NextResponse.json({ error: "Price variation not found" }, { status: 404 })
    }

    await deletePriceVariation(variationId)

    return NextResponse.json({ 
      message: "Price variation deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting price variation:", error)
    return NextResponse.json(
      { error: "Failed to delete price variation" },
      { status: 500 }
    )
  }
}

/**
 * Get default price variation for a product
 */
export async function getDefault(request, productId) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "user", "cashier"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  try {
    const product = await findProductById(productId)
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const variation = await getDefaultPriceVariation(productId)
    return NextResponse.json({ variation })
  } catch (error) {
    console.error("Error getting default price variation:", error)
    return NextResponse.json(
      { error: "Failed to get default price variation" },
      { status: 500 }
    )
  }
}

/**
 * Get active price variations for a product
 */
export async function getActive(request, productId) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "user", "cashier"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  try {
    const product = await findProductById(productId)
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const variations = await getActivePriceVariations(productId)
    return NextResponse.json({ variations })
  } catch (error) {
    console.error("Error getting active price variations:", error)
    return NextResponse.json(
      { error: "Failed to get active price variations" },
      { status: 500 }
    )
  }
}
