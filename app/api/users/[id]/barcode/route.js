import { NextResponse } from "next/server"
import { getSession } from "../../../../../lib/auth"
import { findUserById, updateUserBarcode } from "../../../../../models/userModel"
import { generateBarcodeId, encryptBarcodeId, generateQRCode } from "../../../../../lib/barcode"

export const dynamic = "force-dynamic"

/**
 * POST endpoint to generate barcode for a user
 * POST /api/users/:id/barcode
 */
export async function POST(request, { params }) {
  try {
    // Check authentication and authorization
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = parseInt(params.id)
    
    // User can only generate barcode for themselves unless they're an admin
    if (userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "You can only generate barcode for your own account" },
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

    // Delete existing barcode if present (allow regeneration)
    if (user.barcode_id) {
      // Note: We'll generate a new one, old one will be replaced
    }

    // Generate new barcode
    const plainBarcodeId = generateBarcodeId()
    const encryptedBarcodeId = encryptBarcodeId(plainBarcodeId)

    // Update user with barcode
    const updatedUser = await updateUserBarcode(userId, encryptedBarcodeId)

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to save barcode" },
        { status: 500 }
      )
    }

    // Generate QR code
    const qrCode = await generateQRCode(plainBarcodeId)

    return NextResponse.json({
      success: true,
      barcodeId: plainBarcodeId,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name
      },
      qrCode: qrCode
    })
  } catch (error) {
    console.error('Barcode generation error:', error.message || error)
    console.error('Error details:', error)
    return NextResponse.json(
      { error: "Failed to generate barcode: " + (error.message || "Unknown error") },
      { status: 500 }
    )
    return NextResponse.json(
      { error: "Failed to generate barcode" },
      { status: 500 }
    )
  }
}

/**
 * DELETE endpoint to remove barcode from a user
 * DELETE /api/users/:id/barcode
 */
export async function DELETE(request, { params }) {
  try {
    // Check authentication and authorization
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = parseInt(params.id)
    
    // User can only delete their own barcode unless they're an admin
    if (userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "You can only delete your own barcode" },
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

    if (!user.barcode_id) {
      return NextResponse.json(
        { error: "User has no barcode to delete" },
        { status: 400 }
      )
    }

    // Delete barcode
    const updatedUser = await updateUserBarcode(userId, null)

    return NextResponse.json({
      success: true,
      message: "Barcode deleted successfully",
      user: updatedUser
    })
  } catch (error) {
    console.error('Barcode deletion error:', error.message || error)
    return NextResponse.json(
      { error: "Failed to delete barcode: " + (error.message || "Unknown error") },
      { status: 500 }
    )
  }
}
