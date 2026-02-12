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

  // Use SKU as barcode value, fallback to product ID
  const barcodeValue = product.sku || `P-${product.id}`

  const handlePrint = () => {
    setIsGenerating(true)
    try {
      // Create a temp canvas with JsBarcode for printing
      const tempCanvas = document.createElement('canvas')
      try {
        JsBarcode(tempCanvas, barcodeValue, {
          format: 'CODE128',
          width: 2,
          height: 80,
          displayValue: true,
          fontSize: 14,
          font: 'monospace',
          textMargin: 6,
          margin: 10,
          background: '#ffffff',
          lineColor: '#000000'
        })
      } catch (err) {
        console.error('Error generating barcode:', err)
        setIsGenerating(false)
        return
      }

      const barcodeDataUrl = tempCanvas.toDataURL('image/png')

      const printWindow = window.open('', '_blank', 'width=400,height=300')
      if (!printWindow) {
        alert('Please allow popups for printing')
        setIsGenerating(false)
        return
      }

      const productName = product.name.length > 30 ? product.name.substring(0, 30) + '...' : product.name
      const priceText = product.price ? `LKR ${parseFloat(product.price).toFixed(2)}` : ''

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Barcode - ${product.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: 2in 1in; margin: 0; }
            body {
              width: 2in;
              height: 1in;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-family: Arial, sans-serif;
              background: white;
            }
            img { max-width: 1.8in; height: auto; }
            .name { font-size: 8pt; font-weight: bold; margin-top: 2px; text-align: center; }
            .price { font-size: 8pt; font-weight: bold; text-align: center; }
          </style>
        </head>
        <body>
          <img src="${barcodeDataUrl}" />
          <div class="name">${productName}</div>
          ${priceText ? `<div class="price">${priceText}</div>` : ''}
        </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.focus()
        printWindow.print()
        printWindow.close()
      }
    } catch (error) {
      console.error('Print error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    setIsGenerating(true)
    try {
      // Create a temporary canvas for the barcode
      const tempCanvas = document.createElement('canvas')
      
      // Use JsBarcode to draw CODE128 barcode on canvas
      try {
        JsBarcode(tempCanvas, barcodeValue, {
          format: 'CODE128',
          width: 2,
          height: 80,
          displayValue: true,
          fontSize: 14,
          font: 'monospace',
          textMargin: 6,
          margin: 10,
          background: '#ffffff',
          lineColor: '#000000'
        })
      } catch (err) {
        console.error('Error generating barcode:', err)
        setIsGenerating(false)
        return
      }
      
      // Create final high-res canvas for download (2" x 1" at 300 DPI)
      const printCanvas = document.createElement('canvas')
      const ctx = printCanvas.getContext('2d')
      
      printCanvas.width = 600
      printCanvas.height = 300
      
      // White background
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, printCanvas.width, printCanvas.height)
      
      // Draw barcode centered
      const barcodeWidth = 540
      const barcodeHeight = 160
      const barcodeX = (printCanvas.width - barcodeWidth) / 2
      const barcodeY = 15
      
      ctx.drawImage(tempCanvas, barcodeX, barcodeY, barcodeWidth, barcodeHeight)
      
      // Add product name below barcode
      ctx.fillStyle = 'black'
      ctx.textAlign = 'center'
      
      const maxNameLength = 30
      const productName = product.name.length > maxNameLength 
        ? product.name.substring(0, maxNameLength) + '...' 
        : product.name
      ctx.font = 'bold 16px Arial'
      ctx.fillText(productName, printCanvas.width / 2, barcodeY + barcodeHeight + 25)
      
      // Price
      if (product.price) {
        ctx.font = 'bold 18px Arial'
        ctx.fillText(`LKR ${parseFloat(product.price).toFixed(2)}`, printCanvas.width / 2, barcodeY + barcodeHeight + 50)
      }
      
      // Convert to blob and download
      printCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `barcode-${barcodeValue.replace(/[^a-zA-Z0-9-]/g, '_')}.png`
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
              <CardContent className="p-6 text-center bg-white">
                <div id="barcode-canvas" className="mb-2">
                  <Barcode
                    value={barcodeValue}
                    format="CODE128"
                    width={1.5}
                    height={50}
                    fontSize={12}
                    font="monospace"
                    textMargin={4}
                    margin={5}
                    background="white"
                    lineColor="black"
                    displayValue={true}
                  />
                </div>
                <div className="text-sm font-medium mt-2">
                  {product.name}
                </div>
                {product.price && (
                  <div className="text-sm font-bold text-primary mt-1">
                    LKR {parseFloat(product.price).toFixed(2)}
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
    </>
  )
}
