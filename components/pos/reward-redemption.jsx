"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Gift, Star, AlertCircle, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function RewardRedemption({ 
  customer, 
  onRewardApplied, 
  appliedReward,
  cartTotal 
}) {
  const [rewards, setRewards] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showRewardDialog, setShowRewardDialog] = useState(false)
  const [selectedReward, setSelectedReward] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    if (customer) {
      fetchActiveRewards()
    }
  }, [customer])

  const fetchActiveRewards = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/rewards?active=true')
      const data = await response.json()
      
      if (response.ok) {
        setRewards(data.rewards || [])
      } else {
        console.error('Failed to fetch rewards:', data.error)
      }
    } catch (error) {
      console.error('Error fetching rewards:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const canRedeemReward = (reward) => {
    if (!customer) return false
    
    // Check points balance
    if (customer.points_balance < reward.points_cost) {
      return false
    }
    
    // Check stock
    if (reward.stock_quantity !== null && reward.stock_quantity <= 0) {
      return false
    }
    
    // Check minimum purchase amount for discount rewards
    if (reward.is_discount && reward.min_purchase_amount > 0) {
      if (cartTotal < reward.min_purchase_amount) {
        return false
      }
    }
    
    return true
  }

  const getRewardValue = (reward) => {
    if (reward.is_discount) {
      if (reward.discount_percentage) {
        const discountAmount = (cartTotal * reward.discount_percentage) / 100
        return `${reward.discount_percentage}% off (LKR ${discountAmount.toFixed(2)})`
      } else if (reward.discount_amount) {
        return `LKR ${reward.discount_amount.toFixed(2)} off`
      }
    }
    return 'Item Reward'
  }

  const handleRewardSelection = (reward) => {
    setSelectedReward(reward)
    setShowRewardDialog(true)
  }

  const handleConfirmRedemption = () => {
    if (!selectedReward) return
    
    // Calculate actual discount value
    let discountValue = 0
    if (selectedReward.is_discount) {
      if (selectedReward.discount_percentage) {
        discountValue = (cartTotal * selectedReward.discount_percentage) / 100
      } else if (selectedReward.discount_amount) {
        discountValue = selectedReward.discount_amount
      }
    }
    
    onRewardApplied({
      ...selectedReward,
      calculatedDiscount: discountValue
    })
    
    setShowRewardDialog(false)
    setSelectedReward(null)
    
    toast({
      title: "Reward Applied",
      description: `${selectedReward.name} has been applied to this sale`,
    })
  }

  const handleRemoveReward = () => {
    onRewardApplied(null)
    toast({
      title: "Reward Removed",
      description: "Reward has been removed from this sale",
    })
  }

  if (!customer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-sm">
            <Gift className="mr-2 h-4 w-4" />
            Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-sm text-muted-foreground">
            <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>Select a customer to view available rewards</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <Gift className="mr-2 h-4 w-4" />
              Rewards
            </div>
            <Badge variant="secondary" className="text-xs">
              {customer.points_balance} pts available
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Applied Reward Display */}
          {appliedReward && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-900 text-sm">
                      {appliedReward.name}
                    </span>
                  </div>
                  <p className="text-xs text-green-700">
                    {appliedReward.is_discount 
                      ? `Discount: ${getRewardValue(appliedReward)}`
                      : 'Item reward will be issued'
                    }
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {appliedReward.points_cost} points will be deducted
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveReward}
                  className="text-green-700 hover:text-green-900 h-8 px-2"
                >
                  Remove
                </Button>
              </div>
            </div>
          )}

          {/* Rewards List */}
          {isLoading ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Loading rewards...
            </div>
          ) : rewards.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No rewards available
            </div>
          ) : (
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {rewards.map((reward) => {
                  const canRedeem = canRedeemReward(reward)
                  const isApplied = appliedReward && appliedReward.id === reward.id
                  
                  return (
                    <div
                      key={reward.id}
                      className={`p-3 rounded-md border ${
                        isApplied 
                          ? 'bg-green-50 border-green-300'
                          : canRedeem
                          ? 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                          : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                      onClick={() => canRedeem && !isApplied && handleRewardSelection(reward)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {reward.is_discount ? (
                              <Badge variant="outline" className="text-xs">
                                {reward.discount_percentage 
                                  ? `${reward.discount_percentage}% OFF` 
                                  : `LKR ${reward.discount_amount} OFF`
                                }
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Item
                              </Badge>
                            )}
                            <span className="font-medium text-sm">
                              {reward.name}
                            </span>
                          </div>
                          {reward.description && (
                            <p className="text-xs text-muted-foreground mb-2">
                              {reward.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs">
                            <Badge className="bg-blue-100 text-blue-800">
                              {reward.points_cost} pts
                            </Badge>
                            {reward.is_discount && (
                              <span className="text-green-600 font-medium">
                                {getRewardValue(reward)}
                              </span>
                            )}
                            {reward.stock_quantity !== null && (
                              <span className="text-muted-foreground">
                                Stock: {reward.stock_quantity}
                              </span>
                            )}
                          </div>
                          {!canRedeem && (
                            <p className="text-xs text-red-600 mt-1">
                              {customer.points_balance < reward.points_cost
                                ? 'Insufficient points'
                                : reward.stock_quantity !== null && reward.stock_quantity <= 0
                                ? 'Out of stock'
                                : reward.min_purchase_amount > cartTotal
                                ? `Min. purchase LKR ${reward.min_purchase_amount}`
                                : 'Cannot redeem'
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}

          {/* Info Message */}
          <div className="mt-3 text-xs text-muted-foreground bg-blue-50 p-2 rounded">
            💡 Click on a reward to apply it to this sale
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Reward Redemption</DialogTitle>
            <DialogDescription>
              Are you sure you want to redeem this reward for the customer?
            </DialogDescription>
          </DialogHeader>
          
          {selectedReward && (
            <div className="py-4 space-y-3">
              <div className="p-3 bg-blue-50 rounded-md">
                <h4 className="font-semibold mb-2">{selectedReward.name}</h4>
                {selectedReward.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {selectedReward.description}
                  </p>
                )}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Points Cost:</span>
                    <span className="font-medium">{selectedReward.points_cost} points</span>
                  </div>
                  {selectedReward.is_discount && (
                    <div className="flex justify-between">
                      <span>Discount Value:</span>
                      <span className="font-medium text-green-600">
                        {getRewardValue(selectedReward)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span>Current Points:</span>
                    <span className="font-medium">{customer.points_balance} points</span>
                  </div>
                  <div className="flex justify-between">
                    <span>After Redemption:</span>
                    <span className="font-medium text-blue-600">
                      {customer.points_balance - selectedReward.points_cost} points
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {selectedReward.is_discount 
                  ? 'The discount will be applied to the current sale.'
                  : 'The reward will be issued to the customer after the sale is completed.'
                }
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRewardDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmRedemption}>
              Confirm Redemption
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
