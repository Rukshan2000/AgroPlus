"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useCsrf } from '@/hooks/use-csrf'
import { Loader2 } from 'lucide-react'

export function CustomerFormModal({ customer = null, onSuccess, onCancel }) {
  const [isLoading, setIsLoading] = useState(false)
  const [loyaltyPrograms, setLoyaltyPrograms] = useState([])
  const [formData, setFormData] = useState({
    first_name: customer?.first_name || '',
    last_name: customer?.last_name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    loyalty_program_id: customer?.loyalty_program_id || ''
  })
  const { toast } = useToast()
  const { csrfToken, getHeaders } = useCsrf()

  useEffect(() => {
    fetchLoyaltyPrograms()
  }, [])

  const fetchLoyaltyPrograms = async () => {
    try {
      const response = await fetch('/api/loyalty?active=true')
      const data = await response.json()
      if (response.ok) {
        setLoyaltyPrograms(data.programs || [])
        // Set default program if creating new customer and no program selected
        if (!customer && data.programs?.length > 0 && !formData.loyalty_program_id) {
          setFormData(prev => ({ ...prev, loyalty_program_id: data.programs[0].id }))
        }
      }
    } catch (error) {
      console.error('Error fetching loyalty programs:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Check if CSRF token is available
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
      const url = customer ? `/api/customers/${customer.id}` : '/api/customers'
      const method = customer ? 'PUT' : 'POST'
      
      console.log('Making request with CSRF token:', csrfToken) // Debug log

      const response = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Success',
          description: customer ? 'Customer updated successfully' : 'Customer created successfully',
        })
        onSuccess()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to save customer',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error saving customer:', error)
      toast({
        title: 'Error',
        description: 'Failed to save customer',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => handleChange('first_name', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => handleChange('last_name', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="loyalty_program">Loyalty Program</Label>
        <Select
          value={formData.loyalty_program_id?.toString()}
          onValueChange={(value) => handleChange('loyalty_program_id', parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a loyalty program" />
          </SelectTrigger>
          <SelectContent>
            {loyaltyPrograms.map((program) => (
              <SelectItem key={program.id} value={program.id.toString()}>
                {program.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !csrfToken}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {!csrfToken ? 'Loading...' : customer ? 'Update Customer' : 'Create Customer'}
        </Button>
      </div>
    </form>
  )
}
