'use client'

import React from 'react'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

export default function Receipt({
  isOpen,
  onClose,
  cart,
  onPrint,
  onNewSale,
  saleId
}) {
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const tax = subtotal * 0.08
  const total = subtotal + tax

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] bg-white dark:bg-gray-800 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
            RECEIPT
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-shrink-0 text-center mb-4 text-sm text-gray-600 dark:text-gray-400">
          <p className="font-bold text-gray-900 dark:text-gray-100">AgroPlus</p>
          {saleId && (
            <p className="text-xs mt-1">Sale ID: <span className="font-mono font-bold">{saleId}</span></p>
          )}
          <p>{new Date().toLocaleString()}</p>
        </div>
        
        {/* Scrollable items area */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-4 text-sm pr-2 max-h-[40vh] receipt-scrollbar">
          {cart.map((item, index) => (
            <div key={index} className="flex justify-between">
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-gray-100">{item.name}</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {item.quantity} x LKR {item.unitPrice.toFixed(2)}
                  {item.discount > 0 && ` (-${item.discount}%)`}
                </div>
              </div>
              <div className="font-bold text-gray-900 dark:text-gray-100">LKR {item.total.toFixed(2)}</div>
            </div>
          ))}
        </div>
        
        {/* Fixed footer section */}
        <div className="flex-shrink-0">
          <Separator className="my-4" />
          
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Subtotal:</span>
              <span>LKR {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Tax:</span>
              <span>LKR {tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2 text-gray-900 dark:text-gray-100">
              <span>Total:</span>
              <span>LKR {total.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
            <p>Thank you for your business!</p>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={onPrint} className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button
              variant="outline"
              onClick={onNewSale}
              className="flex-1"
            >
              New Sale
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
