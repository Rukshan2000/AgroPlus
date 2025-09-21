"use client"

import React, { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Star, Calendar, Mail, Phone, CreditCard, TrendingUp } from 'lucide-react'

export function CustomerDetailsModal({ customer, open, onOpenChange }) {
  const [transactions, setTransactions] = useState([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)

  useEffect(() => {
    if (open && customer) {
      fetchTransactions()
    }
  }, [open, customer])

  const fetchTransactions = async () => {
    setIsLoadingTransactions(true)
    try {
      const response = await fetch(`/api/customers/${customer.id}/transactions`)
      const data = await response.json()
      if (response.ok) {
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setIsLoadingTransactions(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'earn':
        return 'bg-green-100 text-green-800'
      case 'redeem':
        return 'bg-red-100 text-red-800'
      case 'adjustment':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTransactionTypeIcon = (type) => {
    switch (type) {
      case 'earn':
        return '+'
      case 'redeem':
        return '-'
      case 'adjustment':
        return '±'
      default:
        return ''
    }
  }

  if (!customer) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customer Details</DialogTitle>
          <DialogDescription>
            View customer information, loyalty points, and transaction history.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Points</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customer.points_balance}</div>
                <p className="text-xs text-muted-foreground">
                  Available for redemption
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customer.total_points_earned}</div>
                <p className="text-xs text-muted-foreground">
                  Lifetime points earned
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Redeemed</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customer.total_points_redeemed}</div>
                <p className="text-xs text-muted-foreground">
                  Points used for rewards
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Customer Information */}
          <Tabs defaultValue="info" className="w-full">
            <TabsList>
              <TabsTrigger value="info">Information</TabsTrigger>
              <TabsTrigger value="transactions">Transaction History</TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Full Name</Label>
                      <p className="text-lg">{customer.first_name} {customer.last_name}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Loyalty Program</Label>
                      <p className="text-lg">{customer.program_name || 'Not enrolled'}</p>
                    </div>
                    <div className="space-y-2 flex items-center">
                      <Mail className="h-4 w-4 text-muted-foreground mr-2" />
                      <div>
                        <Label className="text-sm font-medium">Email</Label>
                        <p>{customer.email || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="space-y-2 flex items-center">
                      <Phone className="h-4 w-4 text-muted-foreground mr-2" />
                      <div>
                        <Label className="text-sm font-medium">Phone</Label>
                        <p>{customer.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="space-y-2 flex items-center">
                      <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                      <div>
                        <Label className="text-sm font-medium">Join Date</Label>
                        <p>{formatDate(customer.join_date)}</p>
                      </div>
                    </div>
                    <div className="space-y-2 flex items-center">
                      <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                      <div>
                        <Label className="text-sm font-medium">Last Activity</Label>
                        <p>{formatDate(customer.last_activity)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>
                    Recent loyalty point transactions for this customer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingTransactions ? (
                    <div className="text-center py-8">Loading transactions...</div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Points</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Receipt</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              {formatDate(transaction.created_at)}
                            </TableCell>
                            <TableCell>
                              <Badge className={getTransactionTypeColor(transaction.type)}>
                                {transaction.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              <span className={transaction.type === 'earn' ? 'text-green-600' : 'text-red-600'}>
                                {getTransactionTypeIcon(transaction.type)}{Math.abs(transaction.points)}
                              </span>
                            </TableCell>
                            <TableCell>{transaction.description}</TableCell>
                            <TableCell>
                              {transaction.receipt_number || 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Label({ children, className }) {
  return <label className={`text-sm font-medium ${className}`}>{children}</label>
}
