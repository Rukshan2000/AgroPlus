'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function InsufficientStockWarning({
  isOpen,
  onClose,
  onConfirm,
  productName,
  availableQuantity,
  requestedQuantity,
  currentCartQuantity
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg text-orange-600 dark:text-orange-400">
            <AlertTriangle className="h-5 w-5" />
            Insufficient Stock
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <p className="font-semibold mb-3">{productName || 'Unknown Product'}</p>
            
            <div className="space-y-2 bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Available Quantity:</span>
                <span className="font-bold text-lg">{availableQuantity || 0}</span>
              </div>
              
              {currentCartQuantity > 0 && (
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Already in Cart:</span>
                  <span className="font-bold">{currentCartQuantity || 0}</span>
                </div>
              )}
              
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>You are trying to add:</span>
                <span className="font-bold text-orange-600 dark:text-orange-400">{requestedQuantity || 0}</span>
              </div>

              {currentCartQuantity > 0 && (
                <div className="flex justify-between text-gray-700 dark:text-gray-300 border-t pt-2">
                  <span>Total would be:</span>
                  <span className="font-bold text-red-600 dark:text-red-400">
                    {(currentCartQuantity || 0) + (requestedQuantity || 0)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            You can add up to <span className="font-bold text-green-600 dark:text-green-400">
              {Math.max(0, (availableQuantity || 0) - (currentCartQuantity || 0))}
            </span> more units of this product.
          </p>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800"
          >
            Add Maximum Available
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
