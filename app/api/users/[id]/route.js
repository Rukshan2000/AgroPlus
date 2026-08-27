import { NextResponse } from "next/server"
import { getSession } from "../../../../lib/auth"
import { findUserById } from "../../../../models/userModel"

export const dynamic = "force-dynamic"

/**
 * GET endpoint to retrieve a specific user's data
 * GET /api/users/:id
 */
export async function GET(request, { params }) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = parseInt(params.id)

    // User can only view their own data unless they're an admin
    if (userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "You can only view your own data" },
        { status: 403 }
      )
    }

    // Get user
    const user = await findUserById(userId)
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Return user data (without sensitive fields)
    return NextResponse.json({
      success: true,
      ...user
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: "Failed to fetch user: " + (error.message || "Unknown error") },
      { status: 500 }
    )
  }
}
