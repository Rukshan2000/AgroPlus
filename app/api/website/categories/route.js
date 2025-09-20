import { query } from "../../../../lib/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Public categories listing without authentication
export async function GET(request) {
  try {
    // Get only active categories for public website
    const result = await query(`
      SELECT 
        id,
        name,
        description,
        color
      FROM categories
      WHERE is_active = true
      ORDER BY name ASC
    `)

    return NextResponse.json({
      categories: result.rows
    })
  } catch (error) {
    console.error('Error in website categories API:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch categories',
      categories: []
    }, { status: 500 })
  }
}
