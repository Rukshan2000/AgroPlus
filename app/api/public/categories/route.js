import { listCategories } from "../../../../models/categoryModel"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request) {
  try {
    // Get only active categories for public view
    const result = await listCategories({ 
      page: 1, 
      limit: 100, 
      is_active: true 
    })

    // Filter out sensitive data for public view
    const publicCategories = result.categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color
    }))

    return NextResponse.json({
      categories: publicCategories
    })
  } catch (error) {
    console.error('Error in public categories API:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch categories' 
    }, { status: 500 })
  }
}
