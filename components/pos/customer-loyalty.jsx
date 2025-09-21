"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Search, UserPlus, Star, X } from 'lucide-react'
import { CustomerFormModal } from './customer-form-modal'

export function CustomerLoyalty({ onCustomerSelect, currentCustomer, onCustomerRemove }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm.length >= 2) {
        handleSearch()
      } else {
        setSearchResults([])
        setShowSearchResults(false)
      }
    }, 300)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm])

  const handleSearch = async () => {
    if (!searchTerm || searchTerm.length < 2) return
    
    setIsSearching(true)
    try {
      const response = await fetch(`/api/customers?search=${encodeURIComponent(searchTerm)}`)
      const data = await response.json()
      if (response.ok) {
        setSearchResults(data.customers || [])
        setShowSearchResults(true)
      }
    } catch (error) {
      console.error('Error searching customers:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleCustomerSelection = (customer) => {
    onCustomerSelect(customer)
    setSearchTerm('')
    setSearchResults([])
    setShowSearchResults(false)
  }

  const handleCustomerCreated = () => {
    setShowCreateModal(false)
    // Optionally refresh search or clear form
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
    if (e.key === 'Escape') {
      setShowSearchResults(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Star className="mr-2 h-4 w-4" />
          Customer Loyalty
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Customer Display */}
        {currentCustomer ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-green-900">
                  {currentCustomer.first_name} {currentCustomer.last_name}
                </p>
                <p className="text-sm text-green-700">
                  {currentCustomer.email && `${currentCustomer.email} • `}
                  {currentCustomer.phone || 'No phone'}
                </p>
                <div className="flex items-center mt-2">
                  <Badge className="bg-green-100 text-green-800">
                    {currentCustomer.points_balance} points
                  </Badge>
                  {currentCustomer.program_name && (
                    <Badge variant="outline" className="ml-2">
                      {currentCustomer.program_name}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCustomerRemove}
                className="text-green-700 hover:text-green-900"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Customer Search */}
            <div className="space-y-2">
              <Label htmlFor="customer-search">Customer Lookup</Label>
              <div className="relative">
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="customer-search"
                      placeholder="Search by name, email, or phone"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="pl-8"
                    />
                  </div>
                  <Button 
                    onClick={handleSearch} 
                    disabled={isSearching || searchTerm.length < 2}
                    size="icon"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-3 text-center text-sm text-muted-foreground">
                        Searching...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-3 text-center text-sm text-muted-foreground">
                        No customers found
                      </div>
                    ) : (
                      searchResults.map((customer) => (
                        <div 
                          key={customer.id} 
                          className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                          onClick={() => handleCustomerSelection(customer)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                {customer.first_name} {customer.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {customer.email || customer.phone || 'No contact info'}
                              </p>
                            </div>
                            <Badge variant="secondary">
                              {customer.points_balance} pts
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <UserPlus className="mr-2 h-4 w-4" /> New Customer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Customer</DialogTitle>
                  </DialogHeader>
                  <CustomerFormModal 
                    onSuccess={handleCustomerCreated}
                    onCancel={() => setShowCreateModal(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* Info */}
            <div className="text-xs text-muted-foreground">
              💡 Search for existing customers or create a new customer to earn loyalty points on this sale.
            </div>
          </>
        )}

        {/* Points Preview */}
        {currentCustomer && (
          <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
            <p>🎉 Customer will earn points on this purchase based on their loyalty program.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
