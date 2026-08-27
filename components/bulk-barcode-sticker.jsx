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
import { Checkbox } from "@/components/ui/checkbox"
import { Printer, Download, QrCode } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

// Helper to get barcode value for a product
const getBarcodeValue = (product) => product.sku || `P-${product.id}`

export default function BulkBarcodeSticker({ isOpen, onClose, products = [] }) {
  const [selectedProducts, setSelectedProducts] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProducts(products.map(p => p.id))
    } else {
      setSelectedProducts([])
    }
  }

  const handleSelectProduct = (productId, checked) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId])
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId))
    }
  }

  const selectedProductsData = products.filter(p => selectedProducts.includes(p.id))

  const handlePrintAll = () => {
    if (selectedProductsData.length === 0) {
      alert('Please select at least one product')
      return
    }
    
    setIsGenerating(true)
    try {
      // Generate barcode images for all selected products
      const barcodeItems = selectedProductsData.map((product) => {
        const tempCanvas = document.createElement('canvas')
        const barcodeVal = getBarcodeValue(product)
        try {
          JsBarcode(tempCanvas, barcodeVal, {
            format: 'CODE128',
            width: 1.8,
            height: 50,
            displayValue: true,
            fontSize: 11,
            font: 'monospace',
            textMargin: 3,
            margin: 5,
            background: '#ffffff',
            lineColor: '#000000'
          })
        } catch (err) {
          console.error('Error generating barcode for', barcodeVal, err)
          return null
        }
        const productName = product.name.length > 22 ? product.name.substring(0, 22) + '...' : product.name
        return {
          dataUrl: tempCanvas.toDataURL('image/png'),
          name: productName,
          price: product.price ? `LKR ${parseFloat(product.price).toFixed(2)}` : ''
        }
      }).filter(Boolean)

      const printWindow = window.open('', '_blank', 'width=800,height=600')
      if (!printWindow) {
        alert('Please allow popups for printing')
        setIsGenerating(false)
        return
      }

      const stickersHtml = barcodeItems.map(item => `
        <div class="sticker">
          <img src="${item.dataUrl}" />
          <div class="name">${item.name}</div>
          ${item.price ? `<div class="price">${item.price}</div>` : ''}
        </div>
      `).join('')

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Bulk Barcodes</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: letter; margin: 0.3in; }
            body {
              font-family: Arial, sans-serif;
              background: white;
            }
            .grid {
              display: flex;
              flex-wrap: wrap;
              gap: 0;
            }
            .sticker {
              width: 2.5in;
              height: 1.2in;
              border: 1px dashed #ccc;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 0.05in;
              page-break-inside: avoid;
            }
            .sticker img { max-width: 2.3in; height: auto; }
            .name { font-size: 7pt; font-weight: bold; text-align: center; margin-top: 1px; }
            .price { font-size: 7pt; font-weight: bold; text-align: center; }
          </style>
        </head>
        <body>
          <div class="grid">${stickersHtml}</div>
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

  const handleDownloadAll = () => {
    if (selectedProductsData.length === 0) {
      alert('Please select at least one product')
      return
    }

    setIsGenerating(true)
    try {
      const cols = 3
      const rows = Math.ceil(selectedProductsData.length / cols)
      const stickerWidth = 300
      const stickerHeight = 180
      
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = cols * stickerWidth
      canvas.height = rows * stickerHeight
      
      // White background
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Generate each barcode
      selectedProductsData.forEach((product, index) => {
        const col = index % cols
        const row = Math.floor(index / cols)
        const x = col * stickerWidth
        const y = row * stickerHeight
        
        // Create barcode on a temp canvas using JsBarcode
        const tempCanvas = document.createElement('canvas')
        const barcodeVal = getBarcodeValue(product)
        
        try {
          JsBarcode(tempCanvas, barcodeVal, {
            format: 'CODE128',
            width: 1.5,
            height: 60,
            displayValue: true,
            fontSize: 12,
            font: 'monospace',
            textMargin: 4,
            margin: 8,
            background: '#ffffff',
            lineColor: '#000000'
          })
        } catch (err) {
          console.error('Error generating barcode for', barcodeVal, err)
          return
        }
        
        // Draw sticker background and border
        ctx.fillStyle = 'white'
        ctx.fillRect(x, y, stickerWidth, stickerHeight)
        ctx.strokeStyle = '#e0e0e0'
        ctx.lineWidth = 1
        ctx.strokeRect(x + 2, y + 2, stickerWidth - 4, stickerHeight - 4)
        
        // Draw barcode centered in sticker
        const barcodeDrawWidth = stickerWidth - 30
        const barcodeDrawHeight = 100
        const barcodeX = x + (stickerWidth - barcodeDrawWidth) / 2
        const barcodeY = y + 10
        
        ctx.drawImage(tempCanvas, barcodeX, barcodeY, barcodeDrawWidth, barcodeDrawHeight)
        
        // Product name
        ctx.fillStyle = 'black'
        ctx.textAlign = 'center'
        ctx.font = 'bold 11px Arial'
        const maxNameLength = 28
        const productName = product.name.length > maxNameLength 
          ? product.name.substring(0, maxNameLength) + '...' 
          : product.name
        ctx.fillText(productName, x + stickerWidth / 2, barcodeY + barcodeDrawHeight + 18)
        
        // Price
        if (product.price) {
          ctx.font = 'bold 12px Arial'
          ctx.fillText(`LKR ${parseFloat(product.price).toFixed(2)}`, x + stickerWidth / 2, barcodeY + barcodeDrawHeight + 35)
        }
      })
      
      // Download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `bulk-barcodes-${new Date().toISOString().split('T')[0]}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      })
    } catch (error) {
      console.error('Error downloading barcodes:', error)
      alert('Failed to download barcodes')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClose = () => {
    setSelectedProducts([])
    onClose()
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-5xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Bulk Barcode Generation
            </DialogTitle>
            <DialogDescription>
              Select products to generate barcode stickers for multiple items
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                  Select All ({products.length} products)
                </label>
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedProducts.length} selected
              </div>
            </div>

            <ScrollArea className="h-[300px] border rounded-md p-4">
              <div className="space-y-2">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center space-x-2 p-2 border rounded">
                    <Checkbox
                      id={`product-${product.id}`}
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={(checked) => handleSelectProduct(product.id, checked)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        SKU: {product.sku || 'N/A'} | Price: LKR {parseFloat(product.price || 0).toFixed(2)} | Stock: {product.stock_quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {selectedProductsData.length > 0 && (
              <div className="border rounded-md p-4 bg-muted/50">
                <h4 className="font-medium mb-3">Preview ({selectedProductsData.length} stickers)</h4>
                <div className="grid grid-cols-1 gap-3 max-h-52 overflow-y-auto">
                  {selectedProductsData.slice(0, 9).map((product) => (
                    <Card key={product.id} className="p-1 bg-white">
                      <CardContent className="p-2 text-center bg-white">
                        <Barcode
                          value={getBarcodeValue(product)}
                          format="CODE128"
                          width={1}
                          height={30}
                          fontSize={8}
                          font="monospace"
                          textMargin={2}
                          margin={2}
                          background="white"
                          lineColor="black"
                          displayValue={true}
                        />
                        <div className="text-xs font-medium text-gray-700 truncate mt-1">
                          {product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name}
                        </div>
                        {product.price && (
                          <div className="text-xs font-bold text-gray-900">
                            LKR {parseFloat(product.price).toFixed(2)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {selectedProductsData.length > 9 && (
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                      +{selectedProductsData.length - 9} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDownloadAll}
              disabled={isGenerating || selectedProductsData.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>
            <Button 
              onClick={handlePrintAll}
              disabled={isGenerating || selectedProductsData.length === 0}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
