"use client"

import { useState } from "react"
import Barcode from "react-barcode"
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
      // Get the barcode canvas
      const canvas = document.querySelector('#barcode-canvas canvas')
      if (canvas) {
        // Create a new canvas with proper dimensions and styling
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
        const barcodeHeight = 120
        const barcodeX = (printCanvas.width - barcodeWidth) / 2
        const barcodeY = 30
        
        ctx.drawImage(canvas, barcodeX, barcodeY, barcodeWidth, barcodeHeight)
        
        // Add barcode number below barcode
        ctx.fillStyle = 'black'
        ctx.textAlign = 'center'
        
        // Barcode number in monospace font
        ctx.font = 'bold 20px monospace'
        const paddedId = product.id.toString().padStart(12, '0')
        ctx.fillText(paddedId, printCanvas.width / 2, barcodeY + barcodeHeight + 25)
        
        // Product name (smaller to fit)
        const maxNameLength = 25
        const productName = product.name.length > maxNameLength 
          ? product.name.substring(0, maxNameLength) + '...' 
          : product.name
        ctx.font = '14px Arial'
        ctx.fillText(productName, printCanvas.width / 2, barcodeY + barcodeHeight + 45)
        
        // SKU if available (very small)
        if (product.sku) {
          ctx.font = '12px Arial'
          ctx.fillStyle = '#666666'
          ctx.fillText(`SKU: ${product.sku}`, printCanvas.width / 2, barcodeY + barcodeHeight + 65)
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
      }
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
