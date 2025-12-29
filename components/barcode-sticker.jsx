"use client"

import { useState } from "react"
import Barcode from "react-barcode"
import JsBarcode from "jsbarcode"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Printer, Download } from "lucide-react"

export default function BarcodeSticker({ isOpen, onClose, product }) {
  const [isGenerating, setIsGenerating] = useState(false)

  if (!product) return null

  const handlePrint = () => {
    setIsGenerating(true)
    setTimeout(() => {
      window.print()
      setIsGenerating(false)
    }, 100)
  }

  const handleDownload = () => {
    setIsGenerating(true)
    try {
      // Create a temporary canvas for the barcode with proper resolution
      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')
      
      // Generate barcode at high resolution
      tempCanvas.width = 800
      tempCanvas.height = 200
      tempCtx.fillStyle = 'white'
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
      
      // Use jsbarcode to draw directly on canvas
      const paddedId = product.id.toString().padStart(12, '0')
      
      try {
        JsBarcode(tempCanvas, paddedId, {
          format: 'EAN13',
          width: 2.5,
          height: 100,
          displayValue: true,
          fontSize: 16,
          margin: 10
        })
      } catch (err) {
        console.error('Error generating barcode:', err)
      }
      
      // Create final high-res canvas for download
      const printCanvas = document.createElement('canvas')
      const ctx = printCanvas.getContext('2d')
      
      // Set canvas size for standard barcode sticker (2" x 1" at 300 DPI)
      printCanvas.width = 600  // 2 inches * 300 DPI
      printCanvas.height = 300 // 1 inch * 300 DPI
      
      // White background
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, printCanvas.width, printCanvas.height)
      
      // Draw barcode centered
      const barcodeWidth = 540  // Leave small margins
      const barcodeHeight = 150
      const barcodeX = (printCanvas.width - barcodeWidth) / 2
      const barcodeY = 20
      
      ctx.drawImage(tempCanvas, barcodeX, barcodeY, barcodeWidth, barcodeHeight)
      
      // Add barcode number below barcode
      ctx.fillStyle = 'black'
      ctx.textAlign = 'center'
      
      // Product name
      const maxNameLength = 25
      const productName = product.name.length > maxNameLength 
        ? product.name.substring(0, maxNameLength) + '...' 
        : product.name
      ctx.font = 'bold 14px Arial'
      ctx.fillText(productName, printCanvas.width / 2, barcodeY + barcodeHeight + 20)
      
      // SKU if available (very small)
      if (product.sku) {
        ctx.font = '12px Arial'
        ctx.fillStyle = '#666666'
        ctx.fillText(`SKU: ${product.sku}`, printCanvas.width / 2, barcodeY + barcodeHeight + 38)
      }
      
      // Convert to blob and download
      printCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `barcode-${product.id}-${product.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      })
    } catch (error) {
      console.error('Error downloading barcode:', error)
      alert('Failed to download barcode')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Barcode Sticker</DialogTitle>
            <DialogDescription>
              Generate barcode sticker for {product.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center py-4">
            <Card className="w-full max-w-sm bg-white">
              <CardContent className="p-8 text-center bg-white">
                <div id="barcode-canvas" className="mb-2">
                  <Barcode
                    value={product.id.toString().padStart(12, '0')}
                    format="EAN13"
                    width={1.8}
                    height={50}
                    fontSize={10}
                    textMargin={5}
                    margin={0}
                    background="white"
                    lineColor="black"
                  />
                </div>
                <div className="text-sm font-mono mt-2 tracking-wider">
                  {product.id.toString().padStart(12, '0')}
                </div>
                <div className="text-xs text-gray-600 mt-1 font-medium">
                  {product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name}
                </div>
                {product.sku && (
                  <div className="text-xs text-gray-500 mt-1">
                    SKU: {product.sku}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDownload}
              disabled={isGenerating}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PNG
            </Button>
            <Button onClick={handlePrint} disabled={isGenerating}>
              <Printer className="h-4 w-4 mr-2" />
              Print Sticker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print-only styles */}
      <style jsx global>{`
        @media print {
          * {
            visibility: hidden;
          }
          
          #barcode-canvas,
          #barcode-canvas * {
            visibility: visible;
          }
          
          #barcode-canvas {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background: white;
            padding: 0.05in;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          /* Standard barcode sticker roll size: 2" x 1" */
          @page {
            size: 2in 1in;
            margin: 0;
          }
          
          /* Alternative sizes for different sticker rolls */
          @page :first {
            size: 2in 1in; /* Most common barcode sticker size */
          }
        }
      `}</style>
    </>
  )
}
