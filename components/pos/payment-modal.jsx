"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { CreditCard, Banknote, CheckCircle } from 'lucide-react'

export default function PaymentModal({
  isOpen,
  onClose,
  total,
  onComplete
}) {
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [amountPaid, setAmountPaid] = useState('')
  const [change, setChange] = useState(0)

  // Auto-set amount paid to total when switching to card
  useEffect(() => {
    if (paymentMethod === 'card') {
      setAmountPaid(total.toFixed(2))
      setChange(0)
    } else if (paymentMethod === 'cash' && !amountPaid) {
      setAmountPaid(total.toFixed(2))
    }
  }, [paymentMethod, total])

  // Calculate change when amount paid changes
  useEffect(() => {
    if (paymentMethod === 'cash' && amountPaid) {
      const paid = parseFloat(amountPaid) || 0
      const changeAmount = paid - total
      setChange(Math.max(0, changeAmount))
    }
  }, [amountPaid, total, paymentMethod])

  const handleComplete = () => {
    const paid = parseFloat(amountPaid) || 0
    
    if (paymentMethod === 'cash' && paid < total) {
      return // Don't proceed if insufficient payment
    }

    onComplete({
      method: paymentMethod,
      amount_paid: paid,
      change: paymentMethod === 'cash' ? change : 0
    })
  }

  const quickAmounts = [
    { label: 'Exact', value: total },
    { label: '500', value: 500 },
    { label: '1000', value: 1000 },
    { label: '2000', value: 2000 },
    { label: '5000', value: 5000 }
  ]

  const isPaidEnough = paymentMethod === 'card' || parseFloat(amountPaid) >= total

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Total Amount */}
          <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                LKR {total.toFixed(2)}
              </p>
            </div>
          </Card>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label className="text-base">Payment Method</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                className={`h-20 flex flex-col gap-2 ${
                  paymentMethod === 'cash' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : ''
                }`}
                onClick={() => setPaymentMethod('cash')}
              >
                <Banknote className="h-8 w-8" />
                <span className="font-semibold">Cash</span>
              </Button>
              
              <Button
                type="button"
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                className={`h-20 flex flex-col gap-2 ${
                  paymentMethod === 'card' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : ''
                }`}
                onClick={() => setPaymentMethod('card')}
              >
                <CreditCard className="h-8 w-8" />
                <span className="font-semibold">Card</span>
              </Button>
            </div>
          </div>

          {/* Cash Payment Details */}
          {paymentMethod === 'cash' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amountPaid">Amount Paid</Label>
                <Input
                  id="amountPaid"
                  type="number"
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="Enter amount paid"
                  className="text-xl h-12"
                  autoFocus
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount.label}
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setAmountPaid(amount.value.toFixed(2))}
                    className="flex-1 min-w-[80px]"
                  >
                    LKR {amount.value.toFixed(0)}
                  </Button>
                ))}
              </div>

              {/* Change Display */}
              {amountPaid && (
                <Card className={`p-4 ${
                  change >= 0 
                    ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {change >= 0 ? 'Change' : 'Insufficient Payment'}
                    </p>
                    <p className={`text-2xl font-bold ${
                      change >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      LKR {Math.abs(change).toFixed(2)}
                    </p>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Card Payment Info */}
          {paymentMethod === 'card' && (
            <Card className="p-4 bg-gray-50 dark:bg-gray-800/50">
              <div className="text-center space-y-2">
                <CreditCard className="h-12 w-12 mx-auto text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Process card payment through your terminal
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Amount: LKR {total.toFixed(2)}
                </p>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleComplete}
              disabled={!isPaidEnough}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Complete Sale
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
