"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { CreditCard, Banknote, CheckCircle, User, Search, Gift, Minus, Plus, Coins } from 'lucide-react'

export default function PaymentModal({
  isOpen,
  onClose,
  total,
  onComplete
}) {
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [amountPaid, setAmountPaid] = useState('')
  const [change, setChange] = useState(0)
  
  // Customer loyalty state
  const [phoneSearch, setPhoneSearch] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [customer, setCustomer] = useState(null)
  const [pointsToRedeem, setPointsToRedeem] = useState(0)
  const [pointsValue, setPointsValue] = useState(0) // LKR value of redeemed points
  const [pointsEarned, setPointsEarned] = useState(0) // Points to be earned from this sale
  const [usePointsPayment, setUsePointsPayment] = useState(false) // Pay with points toggle

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPaymentMethod('cash')
      setAmountPaid('')
      setChange(0)
      setPhoneSearch('')
      setCustomer(null)
      setPointsToRedeem(0)
      setPointsValue(0)
      setUsePointsPayment(false)
    }
  }, [isOpen])

  // Search customer by phone
  const searchCustomer = async () => {
    if (!phoneSearch || phoneSearch.length < 3) return
    
    setIsSearching(true)
    try {
      const response = await fetch(`/api/customers?search=${encodeURIComponent(phoneSearch)}`)
      const data = await response.json()
      
      if (response.ok && data.customers && data.customers.length > 0) {
        // Find exact phone match first, or take first result
        const exactMatch = data.customers.find(c => c.phone === phoneSearch)
        const foundCustomer = exactMatch || data.customers[0]
        setCustomer(foundCustomer)
        setPointsToRedeem(0)
        setPointsValue(0)
        
        // Calculate points to be earned (1 point per 100 LKR by default)
        // This can be adjusted based on loyalty program settings
        const earnRate = foundCustomer.points_per_dollar || 1 // points per dollar/100 LKR
        setPointsEarned(Math.floor(total * earnRate / 100))
      } else {
        setCustomer(null)
      }
    } catch (error) {
      console.error('Error searching customer:', error)
      setCustomer(null)
    } finally {
      setIsSearching(false)
    }
  }

  // Handle phone search on Enter
  const handlePhoneKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchCustomer()
    }
  }

  // Calculate points value (1 point = 1 LKR by default)
  const POINT_VALUE = 1 // 1 point = 1 LKR
  
  // Handle points redemption change
  const handlePointsChange = (value) => {
    const maxPoints = customer?.points_balance || 0
    const maxRedeemableByTotal = Math.floor(total / POINT_VALUE) // Can't redeem more than total
    const maxAllowed = Math.min(maxPoints, maxRedeemableByTotal)
    const newPoints = Math.max(0, Math.min(value, maxAllowed))
    
    setPointsToRedeem(newPoints)
    setPointsValue(newPoints * POINT_VALUE)
  }

  // Toggle pay with points - auto set to max available or total
  const handleUsePointsPayment = (enabled) => {
    setUsePointsPayment(enabled)
    if (enabled && customer) {
      const maxPoints = customer.points_balance || 0
      const maxRedeemableByTotal = Math.floor(total / POINT_VALUE)
      const pointsToUse = Math.min(maxPoints, maxRedeemableByTotal)
      setPointsToRedeem(pointsToUse)
      setPointsValue(pointsToUse * POINT_VALUE)
    } else {
      setPointsToRedeem(0)
      setPointsValue(0)
    }
  }

  // Adjusted total after points redemption
  const adjustedTotal = total - pointsValue

  // Auto-set amount paid to total when switching to card
  useEffect(() => {
    if (paymentMethod === 'card') {
      setAmountPaid(adjustedTotal.toFixed(2))
      setChange(0)
    } else if (paymentMethod === 'cash' && !amountPaid) {
      setAmountPaid(adjustedTotal.toFixed(2))
    }
  }, [paymentMethod, adjustedTotal])

  // Calculate change when amount paid changes
  useEffect(() => {
    if (paymentMethod === 'cash' && amountPaid) {
      const paid = parseFloat(amountPaid) || 0
      const changeAmount = paid - adjustedTotal
      setChange(Math.max(0, changeAmount))
    }
  }, [amountPaid, adjustedTotal, paymentMethod])

  // Recalculate points earned when total changes
  useEffect(() => {
    if (customer) {
      const earnRate = customer.points_per_dollar || 1
      setPointsEarned(Math.floor(adjustedTotal * earnRate / 100))
    }
  }, [adjustedTotal, customer])

  const handleComplete = () => {
    const paid = parseFloat(amountPaid) || 0
    
    if (paymentMethod === 'cash' && paid < adjustedTotal) {
      return // Don't proceed if insufficient payment
    }

    onComplete({
      method: paymentMethod,
      amount_paid: paid,
      change: paymentMethod === 'cash' ? change : 0,
      customer: customer ? {
        id: customer.id,
        name: `${customer.first_name} ${customer.last_name}`,
        phone: customer.phone,
        points_balance: customer.points_balance
      } : null,
      points_redeemed: pointsToRedeem,
      points_value: pointsValue,
      points_earned: pointsEarned
    })
  }

  const clearCustomer = () => {
    setCustomer(null)
    setPhoneSearch('')
    setPointsToRedeem(0)
    setPointsValue(0)
    setPointsEarned(0)
    setUsePointsPayment(false)
  }

  const quickAmounts = [
    { label: 'Exact', value: adjustedTotal },
    { label: '500', value: 500 },
    { label: '1000', value: 1000 },
    { label: '2000', value: 2000 },
    { label: '5000', value: 5000 }
  ]

  const isPaidEnough = paymentMethod === 'card' || parseFloat(amountPaid) >= adjustedTotal

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer Lookup Section */}
          <Card className="p-3 border-purple-200 dark:border-purple-800">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer (Optional)
              </Label>
              
              {!customer ? (
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    placeholder="Enter phone number..."
                    value={phoneSearch}
                    onChange={(e) => setPhoneSearch(e.target.value)}
                    onKeyPress={handlePhoneKeyPress}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={searchCustomer}
                    disabled={isSearching || phoneSearch.length < 3}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-purple-900 dark:text-purple-100">
                        {customer.first_name} {customer.last_name}
                      </p>
                      <p className="text-sm text-purple-600 dark:text-purple-400">{customer.phone}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearCustomer}
                      className="h-6 px-2 text-xs"
                    >
                      Change
                    </Button>
                  </div>
                  
                  {/* Points Balance */}
                  <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded p-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Available Points:</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {customer.points_balance || 0} pts
                    </span>
                  </div>
                  
                  {/* Pay with Points Toggle */}
                  {(customer.points_balance || 0) > 0 && (
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant={usePointsPayment ? 'default' : 'outline'}
                        className={`w-full h-10 ${usePointsPayment ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                        onClick={() => handleUsePointsPayment(!usePointsPayment)}
                      >
                        <Coins className="h-4 w-4 mr-2" />
                        {usePointsPayment ? 'Using Points for Payment' : 'Pay with Points'}
                      </Button>
                      
                      {/* Points Redemption Controls - show when using points */}
                      {usePointsPayment && (
                        <div className="bg-purple-100 dark:bg-purple-900/40 rounded p-2 space-y-2">
                          <Label className="text-xs font-medium">Points to Use (1 pt = LKR 1)</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handlePointsChange(pointsToRedeem - 10)}
                              disabled={pointsToRedeem <= 0}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              value={pointsToRedeem}
                              onChange={(e) => handlePointsChange(parseInt(e.target.value) || 0)}
                              className="text-center h-8 w-24 font-semibold"
                              min="0"
                              max={customer.points_balance || 0}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handlePointsChange(pointsToRedeem + 10)}
                              disabled={pointsToRedeem >= (customer.points_balance || 0)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handlePointsChange(Math.min(customer.points_balance || 0, Math.floor(total)))}
                              className="h-8 text-xs px-3"
                            >
                              Max
                            </Button>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-purple-700 dark:text-purple-300">Discount from points:</span>
                            <span className="font-bold text-green-600">-LKR {pointsValue.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Points to be Earned */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 pt-1 border-t">
                    <Gift className="h-3 w-3" />
                    <span>Will earn: <strong className="text-green-600">{pointsEarned} pts</strong> from this purchase</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Total Amount */}
          <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="text-center space-y-1">
              {pointsValue > 0 && (
                <>
                  <p className="text-sm text-gray-500 line-through">LKR {total.toFixed(2)}</p>
                  <p className="text-xs text-green-600">-LKR {pointsValue.toFixed(2)} (points)</p>
                </>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {pointsValue > 0 ? 'Amount to Pay' : 'Total Amount'}
              </p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                LKR {adjustedTotal.toFixed(2)}
              </p>
            </div>
          </Card>

          {/* Payment Method Selection */}
          <div className="space-y-2">
            <Label className="text-sm">Payment Method</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                className={`h-16 flex flex-col gap-1 ${
                  paymentMethod === 'cash' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : ''
                }`}
                onClick={() => setPaymentMethod('cash')}
              >
                <Banknote className="h-6 w-6" />
                <span className="font-semibold text-sm">Cash</span>
              </Button>
              
              <Button
                type="button"
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                className={`h-16 flex flex-col gap-1 ${
                  paymentMethod === 'card' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : ''
                }`}
                onClick={() => setPaymentMethod('card')}
              >
                <CreditCard className="h-6 w-6" />
                <span className="font-semibold text-sm">Card</span>
              </Button>
            </div>
          </div>

          {/* Cash Payment Details */}
          {paymentMethod === 'cash' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="amountPaid" className="text-sm">Amount Paid</Label>
                <Input
                  id="amountPaid"
                  type="number"
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="Enter amount paid"
                  className="text-lg h-10"
                  autoFocus
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex flex-wrap gap-1">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount.label}
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setAmountPaid(amount.value.toFixed(2))}
                    className="flex-1 min-w-[60px] h-8 text-xs"
                  >
                    {amount.label === 'Exact' ? 'Exact' : `${amount.value}`}
                  </Button>
                ))}
              </div>

              {/* Change Display */}
              {amountPaid && (
                <Card className={`p-3 ${
                  change >= 0 
                    ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {change >= 0 ? 'Change' : 'Insufficient Payment'}
                    </p>
                    <p className={`text-xl font-bold ${
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
            <Card className="p-3 bg-gray-50 dark:bg-gray-800/50">
              <div className="text-center space-y-1">
                <CreditCard className="h-10 w-10 mx-auto text-blue-600 dark:text-blue-400" />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Process card payment through your terminal
                </p>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Amount: LKR {adjustedTotal.toFixed(2)}
                </p>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
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
              <CheckCircle className="h-4 w-4 mr-1" />
              Complete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
