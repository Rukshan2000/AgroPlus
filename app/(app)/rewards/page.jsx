"use client"

import React, { useState, useEffect } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Gift, Star, TrendingUp } from 'lucide-react'

export function RewardsManagement() {
  const [rewards, setRewards] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRewards()
  }, [])

  const fetchRewards = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/rewards')
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (reward) => {
    if (!reward.is_active) {
      return <Badge variant="secondary">Inactive</Badge>
    }
    if (reward.stock_quantity !== null && reward.stock_quantity <= 0) {
      return <Badge variant="destructive">Out of Stock</Badge>
    }
    return <Badge className="bg-green-100 text-green-800">Active</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rewards Management</h1>
          <p className="text-muted-foreground">
            Manage loyalty program rewards and redemption options
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Reward
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rewards.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rewards</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rewards.filter(r => r.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discount Rewards</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rewards.filter(r => r.is_discount).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Points Cost</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rewards.length > 0 ? 
                Math.round(rewards.reduce((total, reward) => total + reward.points_cost, 0) / rewards.length) : 0
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rewards Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rewards</CardTitle>
          <CardDescription>
            Manage your loyalty program rewards and their redemption costs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Points Cost</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading rewards...
                    </TableCell>
                  </TableRow>
                ) : rewards.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No rewards found
                    </TableCell>
                  </TableRow>
                ) : (
                  rewards.map((reward) => (
                    <TableRow key={reward.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{reward.name}</p>
                          {reward.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {reward.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {reward.is_discount ? (
                          <Badge variant="outline">
                            {reward.discount_percentage ? 
                              `${reward.discount_percentage}% off` : 
                              `$${reward.discount_amount} off`
                            }
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Item</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {reward.points_cost} pts
                      </TableCell>
                      <TableCell>
                        {reward.stock_quantity !== null ? 
                          reward.stock_quantity : 'Unlimited'
                        }
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(reward)}
                      </TableCell>
                      <TableCell>{formatDate(reward.created_at)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function RewardsPage() {
  return <RewardsManagement />
}
