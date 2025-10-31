"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Package, Plus, Calendar, StickyNote } from "lucide-react"

export default function RestockProductModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  product = null 
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    quantity_added: "",
    expiry_date: "",
    manufacture_date: "",
    notes: ""
  })
  const [errors, setErrors] = useState({})
  const { toast } = useToast()

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.quantity_added || parseInt(formData.quantity_added) <= 0) {
      newErrors.quantity_added = "Quantity must be greater than 0"
    }

    // If expiry date is provided, validate it's in the future
    if (formData.expiry_date) {
      const expiryDate = new Date(formData.expiry_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (expiryDate < today) {
        newErrors.expiry_date = "Expiry date should be in the future"
      }
    }

    // If manufacture date is provided, validate it's not in the future
    if (formData.manufacture_date) {
      const manufactureDate = new Date(formData.manufacture_date)
      const today = new Date()
      
      if (manufactureDate > today) {
        newErrors.manufacture_date = "Manufacture date cannot be in the future"
      }
    }

    // If both dates are provided, manufacture should be before expiry
    if (formData.manufacture_date && formData.expiry_date) {
      const manufactureDate = new Date(formData.manufacture_date)
      const expiryDate = new Date(formData.expiry_date)
      
      if (manufactureDate >= expiryDate) {
        newErrors.expiry_date = "Expiry date must be after manufacture date"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    
    try {
      // Get CSRF token
      const csrfResponse = await fetch("/api/auth/csrf")
      const csrfData = await csrfResponse.json()
      
      const quantityToAdd = parseInt(formData.quantity_added);
      // First reset stock to match available quantity
      const currentAvailable = product.available_quantity || 0;
      
      // First update to synchronize stock with available
      await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfData.csrfToken
        },
        body: JSON.stringify({
          stock_quantity: currentAvailable,
          available_quantity: currentAvailable
        })
      });

      // Now add the new quantity to both
      const newQuantity = currentAvailable + quantityToAdd;
      
      const requestBody = {
        quantity_added: quantityToAdd,
        // Both stock_quantity and available_quantity should be equal after restock
        stock_quantity: newQuantity,
        available_quantity: newQuantity,
        expiry_date: formData.expiry_date || null,
        manufacture_date: formData.manufacture_date || null,
        notes: formData.notes || null
      }

      const response = await fetch(`/api/products/${product.id}/restock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfData.csrfToken
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        let errorMessage = 'Failed to restock product'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (jsonError) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        throw new Error('Invalid response from server')
      }
      
      toast({
        title: "Success!",
        description: `Added ${formData.quantity_added} units to ${product.name}. New stock: ${data.restock_info.new_stock}`,
      })

      if (onSuccess) {
        onSuccess(data.product)
      }
      
      handleClose()
    } catch (error) {
      console.error('Restock error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to restock product",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      quantity_added: "",
      expiry_date: "",
      manufacture_date: "",
      notes: ""
    })
    setErrors({})
    onClose()
  }

  if (!product) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Restock Product
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Info */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="font-medium">{product.name}</div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                Current Available Quantity: {product.available_quantity || 0} units
              </div>
              {product.stock_quantity !== product.available_quantity && (
                <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-md mt-2">
                  Note: Stock quantity ({product.stock_quantity || 0}) will be synchronized with available quantity ({product.available_quantity || 0}) before restocking
                </div>
              )}
              <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md mt-2">
                New quantities after restock will be: {(product.available_quantity || 0) + parseInt(formData.quantity_added || 0)} units
              </div>
            </div>
            {product.sku && (
              <div className="text-sm text-muted-foreground mt-2">SKU: {product.sku}</div>
            )}
          </div>

          {/* Quantity to Add */}
          <div className="space-y-2">
            <Label htmlFor="quantity_added" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Quantity to Add *
            </Label>
            <Input
              id="quantity_added"
              type="number"
              min="1"
              value={formData.quantity_added}
              onChange={(e) => handleInputChange("quantity_added", e.target.value)}
              placeholder="Enter quantity to add"
              className={errors.quantity_added ? "border-destructive" : ""}
            />
            {errors.quantity_added && (
              <p className="text-sm text-destructive">{errors.quantity_added}</p>
            )}
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label htmlFor="expiry_date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Expiry Date (Optional)
            </Label>
            <Input
              id="expiry_date"
              type="date"
              value={formData.expiry_date}
              onChange={(e) => handleInputChange("expiry_date", e.target.value)}
              className={errors.expiry_date ? "border-destructive" : ""}
            />
            {errors.expiry_date && (
              <p className="text-sm text-destructive">{errors.expiry_date}</p>
            )}
          </div>

          {/* Manufacture Date */}
          <div className="space-y-2">
            <Label htmlFor="manufacture_date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Manufacture Date (Optional)
            </Label>
            <Input
              id="manufacture_date"
              type="date"
              value={formData.manufacture_date}
              onChange={(e) => handleInputChange("manufacture_date", e.target.value)}
              className={errors.manufacture_date ? "border-destructive" : ""}
            />
            {errors.manufacture_date && (
              <p className="text-sm text-destructive">{errors.manufacture_date}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <StickyNote className="h-4 w-4" />
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Add any notes about this restock..."
              className="min-h-[60px]"
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
            >
              {loading ? "Restocking..." : "Restock Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
