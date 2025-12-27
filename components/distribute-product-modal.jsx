"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCsrf } from "@/hooks/use-csrf"

export default function DistributeProductModal({ 
  isOpen, 
  onClose, 
  products, 
  outlets,
  onSuccess,
  editingDistribution = null 
}) {
  const { csrfToken } = useCsrf()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    product_id: editingDistribution?.product_id || "",
    outlet_id: editingDistribution?.outlet_id || "",
    quantity_distributed: editingDistribution?.quantity_distributed || "",
    notes: editingDistribution?.notes || "",
  })

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError(null)
  }

  const getSelectedProduct = () => {
    return products.find(p => p.id === parseInt(formData.product_id))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    
    if (!csrfToken) {
      setError("Security token not loaded. Please refresh and try again.")
      return
    }

    setLoading(true)

    try {
      if (!formData.product_id || !formData.outlet_id || !formData.quantity_distributed) {
        setError("Please fill in all required fields")
        setLoading(false)
        return
      }

      const selectedProduct = getSelectedProduct()
      const quantity = parseFloat(formData.quantity_distributed)

      if (selectedProduct && quantity > selectedProduct.available_quantity) {
        setError(`Insufficient stock. Available: ${selectedProduct.available_quantity}, Requested: ${quantity}`)
        setLoading(false)
        return
      }

      const method = editingDistribution ? "PUT" : "POST"
      const url = editingDistribution 
        ? `/api/product-distribute?id=${editingDistribution.id}`
        : "/api/product-distribute"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          product_id: parseInt(formData.product_id),
          outlet_id: parseInt(formData.outlet_id),
          quantity_distributed: parseFloat(formData.quantity_distributed),
          notes: formData.notes || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to save distribution")
        setLoading(false)
        return
      }

      setFormData({
        product_id: "",
        outlet_id: "",
        quantity_distributed: "",
        notes: "",
      })
      onClose()
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error("Error:", err)
      setError("An error occurred while saving distribution")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingDistribution ? "Edit Distribution" : "Distribute Product"}
          </DialogTitle>
          <DialogDescription>
            {editingDistribution 
              ? "Update the distribution details"
              : "Distribute available products to different outlets"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="product">Product *</Label>
            <Select 
              value={formData.product_id.toString()} 
              onValueChange={(value) => handleChange("product_id", value)}
              disabled={editingDistribution}
            >
              <SelectTrigger id="product">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map(product => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.name} - Available: {product.available_quantity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getSelectedProduct() && (
              <p className="text-sm text-muted-foreground">
                Stock Available: {getSelectedProduct().available_quantity} {getSelectedProduct().unit_type}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="outlet">Outlet *</Label>
            <Select 
              value={formData.outlet_id.toString()} 
              onValueChange={(value) => handleChange("outlet_id", value)}
              disabled={editingDistribution}
            >
              <SelectTrigger id="outlet">
                <SelectValue placeholder="Select an outlet" />
              </SelectTrigger>
              <SelectContent>
                {outlets.map(outlet => (
                  <SelectItem key={outlet.id} value={outlet.id.toString()}>
                    {outlet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity to Distribute *</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={formData.quantity_distributed}
              onChange={(e) => handleChange("quantity_distributed", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this distribution..."
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
            >
              {loading ? "Saving..." : editingDistribution ? "Update" : "Distribute"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
