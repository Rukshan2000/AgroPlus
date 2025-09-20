'use client'

import React from 'react'
import { ShoppingCart, X, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import CartItem from './CartItem'

export default function Cart({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProcessSale,
  isLoading
}) {
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const tax = subtotal * 0.08
  const total = subtotal + tax

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Cart ({cart.length})
          </CardTitle>
          {cart.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onClearCart}
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Cart Items */}
        <ScrollArea className="h-80 mb-6">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item, index) => (
                <CartItem
                  key={index}
                  item={item}
                  index={index}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemove={onRemoveItem}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Total Section */}
        {cart.length > 0 && (
          <div className="space-y-4">
            <Separator />
            <Card className="bg-gray-50 dark:bg-gray-800/50">
              <CardContent className="p-4">
                <div className="space-y-2 text-lg">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">Subtotal:</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">Tax (8%):</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">${tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-2xl font-bold text-green-600 dark:text-green-400">
                    <span>TOTAL:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Button
              onClick={onProcessSale}
              className="w-full h-14 text-xl font-bold"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                "Processing..."
              ) : (
                <>
                  <CheckCircle className="h-6 w-6 mr-2" />
                  COMPLETE SALE
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
