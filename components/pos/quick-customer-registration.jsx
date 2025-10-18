"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { CreditCard, UserPlus, Loader2, CheckCircle, Gift, Printer } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useCsrf } from '@/hooks/use-csrf'

export function QuickCustomerRegistration({ onCustomerCreated, isOpen, onClose }) {
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [newCustomer, setNewCustomer] = useState(null)
  const [loyaltyProgram, setLoyaltyProgram] = useState(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: ''
  })
  const { toast } = useToast()
  const { csrfToken, getHeaders } = useCsrf()

  useEffect(() => {
    if (isOpen) {
      fetchActiveLoyaltyProgram()
      // Reset form when opened
      setFormData({
        first_name: '',
        last_name: '',
        phone: '',
        email: ''
      })
      setShowSuccess(false)
      setNewCustomer(null)
    }
  }, [isOpen])

  const fetchActiveLoyaltyProgram = async () => {
    try {
      const response = await fetch('/api/loyalty?active=true')
      const data = await response.json()
      if (response.ok && data.programs?.length > 0) {
        setLoyaltyProgram(data.programs[0])
      }
    } catch (error) {
      console.error('Error fetching loyalty program:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!csrfToken) {
      toast({
        title: 'Error',
        description: 'Security token not ready. Please try again.',
        variant: 'destructive',
      })
      return
    }
    
    setIsLoading(true)

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          ...formData,
          loyalty_program_id: loyaltyProgram?.id
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setNewCustomer(data)
        setShowSuccess(true)
        
        toast({
          title: 'Loyalty Card Issued!',
          description: `Welcome ${data.first_name} ${data.last_name} to our loyalty program!`,
        })
        
        // Don't close immediately, show success screen
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create customer',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error creating customer:', error)
      toast({
        title: 'Error',
        description: 'Failed to create customer',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDone = () => {
    if (newCustomer && onCustomerCreated) {
      onCustomerCreated(newCustomer)
    }
    onClose()
  }

  const handlePrintCard = () => {
    window.print()
  }

  const generateCardNumber = (customer) => {
    // Use the card number from database if available
    if (customer?.loyalty_card_number) {
      return customer.loyalty_card_number
    }
    // Fallback: Generate a formatted loyalty card number from customer ID
    const paddedId = String(customer?.id || 0).padStart(8, '0')
    return `LC-${paddedId.slice(0, 4)}-${paddedId.slice(4)}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Issue Loyalty Card
          </DialogTitle>
          <DialogDescription>
            Register a new customer and issue them a loyalty card instantly
          </DialogDescription>
        </DialogHeader>

        {!showSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Loyalty Program Info */}
            {loyaltyProgram && (
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    {loyaltyProgram.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Earn Rate:</span>
                    <Badge className="bg-green-100 text-green-800">
                      {loyaltyProgram.points_per_dollar} pts per LKR
                    </Badge>
                  </div>
                  {loyaltyProgram.signup_bonus > 0 && (
                    <div className="flex justify-between">
                      <span>Welcome Bonus:</span>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {loyaltyProgram.signup_bonus} points
                      </Badge>
                    </div>
                  )}
                  {loyaltyProgram.description && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {loyaltyProgram.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  placeholder="John"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+94 77 123 4567"
                required
              />
              <p className="text-xs text-muted-foreground">
                Used for loyalty card lookup and promotions
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="john.doe@example.com"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !csrfToken}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!csrfToken ? 'Loading...' : 'Issue Loyalty Card'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Success Screen with Loyalty Card */}
            <div className="text-center py-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-900 mb-2">
                Loyalty Card Issued Successfully!
              </h3>
              <p className="text-muted-foreground">
                Customer has been registered and can start earning points
              </p>
            </div>

            {/* Loyalty Card Display */}
            {newCustomer && (
              <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-xs uppercase tracking-wider opacity-80 mb-1">
                        Loyalty Card
                      </p>
                      <h4 className="text-2xl font-bold">
                        {newCustomer.first_name} {newCustomer.last_name}
                      </h4>
                    </div>
                    <CreditCard className="h-8 w-8 opacity-80" />
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider opacity-80">Card Number</p>
                      <p className="text-xl font-mono font-bold tracking-wider">
                        {generateCardNumber(newCustomer)}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider opacity-80">Phone</p>
                        <p className="font-medium">{newCustomer.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider opacity-80">Points Balance</p>
                        <p className="font-bold text-lg">
                          {newCustomer.points_balance || loyaltyProgram?.signup_bonus || 0} pts
                        </p>
                      </div>
                    </div>
                    
                    {loyaltyProgram && (
                      <div className="pt-3 border-t border-white/20">
                        <p className="text-xs opacity-80">{loyaltyProgram.name}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Benefits Summary */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm text-blue-900 mb-3">
                🎉 Customer Benefits:
              </h4>
              <ul className="space-y-2 text-sm text-blue-800">
                {loyaltyProgram?.signup_bonus > 0 && (
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Welcome bonus of <strong>{loyaltyProgram.signup_bonus} points</strong> credited</span>
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Earn <strong>{loyaltyProgram?.points_per_dollar || 1} points</strong> for every LKR spent</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Redeem points for <strong>rewards and discounts</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Lookup by phone number: <strong>{newCustomer?.phone}</strong></span>
                </li>
              </ul>
            </div>

            <DialogFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={handlePrintCard}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print Card
              </Button>
              <Button onClick={handleDone} className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Use This Customer
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
