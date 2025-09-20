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
import { Checkbox } from "@/components/ui/checkbox"
import { Printer, Download, QrCode } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

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
    setTimeout(() => {
      window.print()
      setIsGenerating(false)
    }, 100)
  }

  const handleDownloadAll = () => {
    if (selectedProductsData.length === 0) {
      alert('Please select at least one product')
      return
    }

    setIsGenerating(true)
    try {
      // Create a canvas for all barcodes
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Set canvas size for multiple stickers on standard sticker sheet
      const cols = 4  // 4 stickers per row (fits on 8.5" width)
      const rows = Math.ceil(selectedProductsData.length / cols)
      const stickerWidth = 200  // 2" at 100 DPI
      const stickerHeight = 100 // 1" at 100 DPI
      
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
        
        // Create individual barcode canvas
        const tempCanvas = document.createElement('canvas')
        const tempCtx = tempCanvas.getContext('2d')
        tempCanvas.width = stickerWidth
        tempCanvas.height = stickerHeight
        
        // White background for individual sticker
        tempCtx.fillStyle = 'white'
        tempCtx.fillRect(0, 0, stickerWidth, stickerHeight)
        
        // Draw border
        tempCtx.strokeStyle = '#e5e5e5'
        tempCtx.lineWidth = 1
        tempCtx.strokeRect(0, 0, stickerWidth, stickerHeight)
        
        // Add text
        tempCtx.fillStyle = 'black'
        tempCtx.textAlign = 'center'
        
        // Barcode number
        tempCtx.font = 'bold 8px monospace'
        const paddedId = product.id.toString().padStart(12, '0')
        tempCtx.fillText(paddedId, stickerWidth / 2, 20)
        
        // Product name (truncated)
        const maxNameLength = 18
        const productName = product.name.length > maxNameLength 
          ? product.name.substring(0, maxNameLength) + '...' 
          : product.name
        tempCtx.font = '6px Arial'
        tempCtx.fillText(productName, stickerWidth / 2, stickerHeight - 15)
        
        // SKU if available
        if (product.sku) {
          tempCtx.font = '5px Arial'
          tempCtx.fillStyle = '#666666'
          tempCtx.fillText(`SKU: ${product.sku}`, stickerWidth / 2, stickerHeight - 5)
        }
        
        // Copy to main canvas
        ctx.drawImage(tempCanvas, x, y)
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
        <DialogContent className="max-w-4xl max-h-[80vh]">
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
                        ID: {product.id} | SKU: {product.sku || 'N/A'} | Stock: {product.stock_quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {selectedProductsData.length > 0 && (
              <div className="border rounded-md p-4 bg-muted/50">
                <h4 className="font-medium mb-3">Preview ({selectedProductsData.length} stickers)</h4>
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {selectedProductsData.slice(0, 9).map((product) => (
                    <Card key={product.id} className="p-2 bg-white">
                      <CardContent className="p-2 text-center bg-white">
                        <div className="text-xs mb-1">
                          <Barcode
                            value={product.id.toString().padStart(12, '0')}
                            format="EAN13"
                            width={1}
                            height={25}
                            fontSize={6}
                            textMargin={2}
                            margin={2}
                            background="white"
                            lineColor="black"
                          />
                        </div>
                        <div className="text-xs font-mono tracking-wide">{product.id.toString().padStart(12, '0')}</div>
                        <div className="text-xs text-gray-600 truncate font-medium">
                          {product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name}
                        </div>
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

      {/* Print-only styles */}
      <style jsx global>{`
        @media print {
          * {
            visibility: hidden;
          }
          
          .print-barcodes,
          .print-barcodes * {
            visibility: visible;
          }
          
          .print-barcodes {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: white;
            padding: 0.25in;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          /* Standard sticker sheet for bulk printing */
          @page {
            size: letter;
            margin: 0.5in;
          }
          
          /* Individual sticker size on the page */
          .sticker-item {
            width: 2in;
            height: 1in;
            page-break-inside: avoid;
            margin: 0.1in;
            border: 1px solid #ddd;
            display: inline-block;
            vertical-align: top;
          }
        }
      `}</style>

      {/* Hidden print content */}
      {selectedProductsData.length > 0 && (
        <div className="print-barcodes hidden print:block">
          <div className="flex flex-wrap">
            {selectedProductsData.map((product) => (
              <div key={product.id} className="sticker-item p-2 text-center bg-white">
                <Barcode
                  value={product.id.toString().padStart(12, '0')}
                  format="EAN13"
                  width={1.5}
                  height={35}
                  fontSize={8}
                  textMargin={3}
                  margin={2}
                  background="white"
                  lineColor="black"
                />
                <div className="mt-1 text-xs font-mono tracking-wider">{product.id.toString().padStart(12, '0')}</div>
                <div className="text-xs font-medium text-gray-600 truncate">
                  {product.name.length > 18 ? product.name.substring(0, 18) + '...' : product.name}
                </div>
                {product.sku && (
                  <div className="text-xs text-gray-500 truncate">SKU: {product.sku}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
