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
  saleId,
  customer = null,
  rewardDiscount = 0,
  pointsEarned = 0,
  pointsRedeemed = 0
}) {
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const subtotalAfterReward = Math.max(0, subtotal - rewardDiscount)
  const tax = subtotalAfterReward * 0.08
  const total = subtotalAfterReward + tax

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
            RECEIPT
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center mb-4 text-sm text-gray-600 dark:text-gray-400">
          <p className="font-bold text-gray-900 dark:text-gray-100">AgroPlus</p>
          {saleId && (
            <p className="text-xs mt-1">Sale ID: <span className="font-mono font-bold">{saleId}</span></p>
          )}
          <p>{new Date().toLocaleString()}</p>
        </div>
        
        <div className="space-y-2 mb-4 text-sm">
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
        
        <Separator className="my-4" />
        
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>Subtotal:</span>
            <span>LKR {subtotal.toFixed(2)}</span>
          </div>
          {rewardDiscount > 0 && (
            <div className="flex justify-between text-green-600 dark:text-green-400">
              <span>Reward Discount:</span>
              <span>- LKR {rewardDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>Tax (8%):</span>
            <span>LKR {tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2 text-gray-900 dark:text-gray-100">
            <span>Total:</span>
            <span>LKR {total.toFixed(2)}</span>
          </div>
        </div>

        {/* Loyalty Information */}
        {customer && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-sm space-y-1">
              <div className="font-semibold text-blue-900 dark:text-blue-100">
                {customer.first_name} {customer.last_name}
              </div>
              {customer.loyalty_card_number && (
                <div className="text-xs text-blue-700 dark:text-blue-300 font-mono">
                  Card: {customer.loyalty_card_number}
                </div>
              )}
              <div className="flex justify-between text-xs pt-2 border-t border-blue-200 dark:border-blue-700">
                <span className="text-blue-700 dark:text-blue-300">Points Earned:</span>
                <span className="font-bold text-green-600 dark:text-green-400">+{pointsEarned}</span>
              </div>
              {pointsRedeemed > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-blue-700 dark:text-blue-300">Points Redeemed:</span>
                  <span className="font-bold text-red-600 dark:text-red-400">-{pointsRedeemed}</span>
                </div>
              )}
              <div className="flex justify-between text-xs pt-1">
                <span className="text-blue-700 dark:text-blue-300">New Balance:</span>
                <span className="font-bold text-blue-900 dark:text-blue-100">
                  {(customer.points_balance || 0) + pointsEarned - pointsRedeemed} pts
                </span>
              </div>
            </div>
          </div>
        )}
        
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
      </DialogContent>
    </Dialog>
  )
}
