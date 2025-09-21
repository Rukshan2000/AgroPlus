"use client"

import React, { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useCsrf } from '@/hooks/use-csrf'
import { Loader2, Plus, Minus } from 'lucide-react'

export function AdjustPointsModal({ customer, open, onOpenChange, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false)
  const [adjustment, setAdjustment] = useState({
    points: '',
    reason: '',
    type: 'add' // 'add' or 'subtract'
  })
  const { toast } = useToast()
  const { csrfToken, getHeaders } = useCsrf()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const points = parseInt(adjustment.points)
      if (isNaN(points) || points <= 0) {
        toast({
          title: 'Error',
          description: 'Please enter a valid positive number for points',
          variant: 'destructive',
        })
        return
      }

      if (!adjustment.reason.trim()) {
        toast({
          title: 'Error',
          description: 'Please provide a reason for the adjustment',
          variant: 'destructive',
        })
        return
      }

      const finalPoints = adjustment.type === 'add' ? points : -points

      const response = await fetch(`/api/customers/${customer.id}/adjust-points`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          points: finalPoints,
          reason: adjustment.reason.trim()
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Points ${adjustment.type === 'add' ? 'added' : 'deducted'} successfully`,
        })
        setAdjustment({ points: '', reason: '', type: 'add' })
        onSuccess()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to adjust points',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error adjusting points:', error)
      toast({
        title: 'Error',
        description: 'Failed to adjust points',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTypeChange = (type) => {
    setAdjustment(prev => ({ ...prev, type }))
  }

  if (!customer) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Points</DialogTitle>
          <DialogDescription>
            Adjust loyalty points for this customer. You can add or subtract points with an optional reason.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p><strong>{customer.first_name} {customer.last_name}</strong></p>
            <p>Current Balance: <span className="font-medium">{customer.points_balance} points</span></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Adjustment Type */}
            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={adjustment.type === 'add' ? 'default' : 'outline'}
                  onClick={() => handleTypeChange('add')}
                  className="flex-1"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Points
                </Button>
                <Button
                  type="button"
                  variant={adjustment.type === 'subtract' ? 'default' : 'outline'}
                  onClick={() => handleTypeChange('subtract')}
                  className="flex-1"
                >
                  <Minus className="mr-2 h-4 w-4" />
                  Deduct Points
                </Button>
              </div>
            </div>

            {/* Points Amount */}
            <div className="space-y-2">
              <Label htmlFor="points">Points Amount</Label>
              <Input
                id="points"
                type="number"
                min="1"
                value={adjustment.points}
                onChange={(e) => setAdjustment(prev => ({ ...prev, points: e.target.value }))}
                placeholder="Enter points amount"
                required
              />
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Adjustment</Label>
              <Textarea
                id="reason"
                value={adjustment.reason}
                onChange={(e) => setAdjustment(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Explain why you're adjusting the points..."
                required
              />
            </div>

            {/* Preview */}
            {adjustment.points && !isNaN(parseInt(adjustment.points)) && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">
                  <strong>Preview:</strong> Customer will have{' '}
                  <span className="font-medium">
                    {adjustment.type === 'add' 
                      ? customer.points_balance + parseInt(adjustment.points)
                      : customer.points_balance - parseInt(adjustment.points)
                    } points
                  </span>{' '}
                  after this adjustment.
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Apply Adjustment
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
