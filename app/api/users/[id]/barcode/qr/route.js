import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { findUserById } from "@/models/userModel"
import { decryptBarcodeId, generateQRCode } from "@/lib/barcode"

export const dynamic = "force-dynamic"

/**
 * GET endpoint to retrieve QR code for a user's existing barcode
 * GET /api/users/:id/barcode/qr
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

    // User can only view their own barcode unless they're an admin
    if (userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "You can only view your own barcode" },
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

    // Check if user has a barcode
    if (!user.barcode_id) {
      return NextResponse.json(
        { error: "User has no barcode" },
        { status: 404 }
      )
    }

    // Decrypt the barcode ID
    let plainBarcodeId
    try {
      plainBarcodeId = decryptBarcodeId(user.barcode_id)
    } catch (error) {
      console.error('Error decrypting barcode:', error)
      return NextResponse.json(
        { error: "Failed to decrypt barcode" },
        { status: 500 }
      )
    }

    // Generate QR code
    const qrCode = await generateQRCode(plainBarcodeId)

    return NextResponse.json({
      success: true,
      barcodeId: plainBarcodeId,
      qrCode: qrCode
    })
  } catch (error) {
    console.error('QR code retrieval error:', error)
    return NextResponse.json(
      { error: "Failed to retrieve QR code: " + (error.message || "Unknown error") },
      { status: 500 }
    )
  }
}
