import { NextResponse } from "next/server"
import { findUserByBarcodeId } from "../../../../models/userModel"
import { createSession } from "../../../../lib/auth"
import { getOrCreateCsrfToken } from "../../../../lib/csrf"
import { createWorkSession, getCurrentWorkSession, endWorkSession } from "../../../../models/hrModel"

export const dynamic = "force-dynamic"

/**
 * Barcode login endpoint
 * Accepts a barcode ID and logs in the user automatically
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { barcodeId } = body

    if (!barcodeId || typeof barcodeId !== 'string' || barcodeId.trim() === '') {
      return NextResponse.json(
        { error: "Barcode ID is required" },
        { status: 400 }
      )
    }

    console.log('Attempting barcode login with ID:', barcodeId.substring(0, 8) + '...')

    // Find user by barcode ID
    const user = await findUserByBarcodeId(barcodeId)
    if (!user) {
      console.warn('User not found for barcode:', barcodeId.substring(0, 8) + '...')
      return NextResponse.json(
        { error: "Invalid barcode or user not found" },
        { status: 401 }
      )
    }

    console.log('Barcode login successful for user:', user.email)

    // Create session for the user
    await createSession(user.id)
    await getOrCreateCsrfToken()

    // Create work session for cashier users
    if (user.role === 'cashier') {
      try {
        // End any existing active session first
        const existingSession = await getCurrentWorkSession(user.id)
        if (existingSession) {
          await endWorkSession(user.id, 'Auto-ended on new login')
        }

        // Create new work session
        await createWorkSession(user.id)
      } catch (error) {
        console.error('Error creating work session:', error)
        // Don't fail login if work session creation fails
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        outlets: user.outlets || []
      }
    })
  } catch (error) {
    console.error('Barcode login error:', error)
    return NextResponse.json(
      { error: "An error occurred during barcode login" },
      { status: 500 }
    )
  }
}
