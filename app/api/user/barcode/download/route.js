import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { findUserById } from "@/models/userModel"
import { generateBarcodePDF, generateQRCode } from "@/lib/barcode.js"

export const dynamic = "force-dynamic"

/**
 * Download barcode as PDF or PNG
 * GET /api/user/barcode/download?format=pdf&userId=<id>
 */
export async function GET(request) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'pdf' // pdf or png
    const userId = searchParams.get('userId') || session.user.id
    const adminOverride = searchParams.get('adminOverride') === 'true'

    // User can only download their own barcode unless they're an admin
    if (userId !== String(session.user.id) && !adminOverride) {
      return NextResponse.json(
        { error: "You can only download your own barcode" },
        { status: 403 }
      )
    }

    // Get user details
    const user = await findUserById(parseInt(userId))
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // User should have a barcode ID
    if (!user.barcode_id) {
      return NextResponse.json(
        { error: "Barcode not generated for this user" },
        { status: 404 }
      )
    }

    if (format === 'pdf') {
      try {
        const pdfBuffer = await generateBarcodePDF(
          user.barcode_id,
          user.name,
          user.email
        )

        return new NextResponse(pdfBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="barcode-${user.email}-${new Date().getTime()}.pdf"`
          }
        })
      } catch (error) {
        console.error('Error generating PDF:', error)
        return NextResponse.json(
          { error: "Failed to generate PDF" },
          { status: 500 }
        )
      }
    } else if (format === 'png') {
      try {
        const dataUrl = await generateQRCode(user.barcode_id)
        const base64Data = dataUrl.split(',')[1]
        const imageBuffer = Buffer.from(base64Data, 'base64')

        return new NextResponse(imageBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'image/png',
            'Content-Disposition': `attachment; filename="barcode-${user.email}-${new Date().getTime()}.png"`
          }
        })
      } catch (error) {
        console.error('Error generating PNG:', error)
        return NextResponse.json(
          { error: "Failed to generate PNG" },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { error: "Invalid format. Use 'pdf' or 'png'" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Barcode download error:', error)
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    )
  }
}

/**
 * POST endpoint to display barcode (preview)
 * Returns the QR code as base64
 */
export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { userId } = body || {}

    // User can only view their own barcode unless they're an admin
    if (userId && userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only view your own barcode" },
        { status: 403 }
      )
    }

    const user = await findUserById(parseInt(userId || session.user.id))
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    if (!user.barcode_id) {
      return NextResponse.json(
        { error: "Barcode not generated for this user" },
        { status: 404 }
      )
    }

    const qrCodeDataUrl = await generateQRCode(user.barcode_id)

    return NextResponse.json({
      barcodeId: user.barcode_id,
      userName: user.name,
      userEmail: user.email,
      qrCode: qrCodeDataUrl
    })
  } catch (error) {
    console.error('Barcode preview error:', error)
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    )
  }
}
