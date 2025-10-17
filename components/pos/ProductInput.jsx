'use client'

import React, { useRef, useEffect } from 'react'
import { 
  Plus, 
  Minus, 
  Percent, 
  Calculator,
  Scan,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import ProductGrid from './ProductGrid'

export default function ProductInput({
  productId,
  setProductId,
  quantity,
  setQuantity,
  discount,
  setDiscount,
  products,
  productSearch,
  setProductSearch,
  filteredProducts,
  onAddToCart,
  findProduct,
  getProductPrice
}) {
  const productIdRef = useRef(null)

  // Focus on product ID input
  useEffect(() => {
    if (productIdRef.current) {
      productIdRef.current.focus()
    }
  }, [])

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onAddToCart()
    }
    // Quick access shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch(e.key) {
        case 'f':
          e.preventDefault()
          // Focus will be handled by ProductGrid
          break
        case 'q':
          e.preventDefault()
          incrementQuantity()
          break
        case 'd':
          e.preventDefault()
          document.querySelector('input[placeholder="0"]')?.focus()
          break
      }
    }
  }

  const incrementQuantity = () => {
    setQuantity(prev => (parseInt(prev) + 1).toString())
  }

  const decrementQuantity = () => {
    setQuantity(prev => Math.max(1, parseInt(prev) - 1).toString())
  }

  const foundProduct = productId ? findProduct(productId) : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          Add Item
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Product ID Input */}
        <div className="space-y-2">
          <Label htmlFor="productId" className="text-base font-semibold">
            Product ID / SKU
          </Label>
          <div className="flex gap-2">
            <Input
              id="productId"
              ref={productIdRef}
              type="text"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-lg font-mono"
              placeholder="Scan or enter ID/SKU"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => productIdRef.current?.focus()}
            >
              <Calculator className="h-4 w-4" />
            </Button>
          </div>
          {productId && foundProduct && (
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200 font-semibold">
                ✓ {foundProduct.name} - LKR {getProductPrice(foundProduct).toFixed(2)}
                <br />
                Available: {foundProduct.available_quantity} units
              </AlertDescription>
            </Alert>
          )}
          {productId && !foundProduct && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Product not found
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Quantity and Discount */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-base font-semibold">Quantity</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={decrementQuantity}
                className="h-10 w-10 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-900/20"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="text-center text-lg font-bold h-10 border-2 focus:border-blue-500"
                min="1"
                max={foundProduct?.available_quantity || 999}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={incrementQuantity}
                className="h-10 w-10 hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-900/20"
                disabled={foundProduct && parseInt(quantity) >= foundProduct.available_quantity}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {foundProduct && parseInt(quantity) > foundProduct.available_quantity && (
              <p className="text-xs text-red-600 dark:text-red-400">
                Max available: {foundProduct.available_quantity}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Discount %</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="text-center text-lg font-bold h-10 border-2 focus:border-blue-500"
                placeholder="0"
                min="0"
                max="100"
              />
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center border-2 border-gray-200 dark:border-gray-600">
                <Percent className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </div>
            </div>
            {discount && parseFloat(discount) > 0 && foundProduct && (
              <p className="text-xs text-green-600 dark:text-green-400">
                Save: LKR {((getProductPrice(foundProduct) * parseFloat(discount)) / 100 * parseInt(quantity || 1)).toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {/* Add Button */}
        <Button
          onClick={onAddToCart}
          className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
          size="lg"
          disabled={!foundProduct}
        >
          <Plus className="h-5 w-5 mr-2" />
          ADD TO CART {foundProduct && `(LKR ${(getProductPrice(foundProduct) * parseInt(quantity || 1) * (1 - (parseFloat(discount) || 0) / 100)).toFixed(2)})`}
        </Button>

        {/* Product Search */}
        <ProductGrid
          productSearch={productSearch}
          setProductSearch={setProductSearch}
          filteredProducts={filteredProducts}
          onProductSelect={setProductId}
        />

        {/* Keyboard Shortcuts Help */}
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border">
          <div className="font-semibold mb-2 text-gray-700 dark:text-gray-300">⌨️ Keyboard Shortcuts:</div>
          <div className="grid grid-cols-2 gap-2">
            <div><kbd className="px-1 py-0.5 bg-white dark:bg-gray-700 rounded border text-xs">Enter</kbd> Add to cart</div>
            <div><kbd className="px-1 py-0.5 bg-white dark:bg-gray-700 rounded border text-xs">Ctrl+Q</kbd> +1 Quantity</div>
            <div><kbd className="px-1 py-0.5 bg-white dark:bg-gray-700 rounded border text-xs">Ctrl+F</kbd> Search products</div>
            <div><kbd className="px-1 py-0.5 bg-white dark:bg-gray-700 rounded border text-xs">Ctrl+D</kbd> Set discount</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
