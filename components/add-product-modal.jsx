"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog"

export default function AddProductModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  product = null, 
  categories = [] 
}) {
  const [loading, setLoading] = useState(false)
  const [units, setUnits] = useState([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "", // Keep for backward compatibility
    buying_price: "",
    selling_price: "",
    sku: "",
    category: "",
    stock_quantity: "",
    is_active: true,
    image_url: "",
    unit_type: "kg",
    unit_value: ""
  })
  const [errors, setErrors] = useState({})

  const isEditing = !!product

  // Fetch available units on component mount
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const res = await fetch('/api/products/units')
        if (res.ok) {
          const data = await res.json()
          setUnits(data.units || [])
        }
      } catch (error) {
        console.error('Failed to fetch units:', error)
      }
    }
    fetchUnits()
  }, [])

  useEffect(() => {
    if (isOpen) {
      if (product) {
        // Edit mode - populate form with product data
        setFormData({
          name: product.name || "",
          description: product.description || "",
          price: product.price?.toString() || product.selling_price?.toString() || "",
          buying_price: product.buying_price?.toString() || "",
          selling_price: product.selling_price?.toString() || product.price?.toString() || "",
          sku: product.sku || "",
          category: product.category || "",
          stock_quantity: product.stock_quantity?.toString() || "",
          is_active: product.is_active,
          image_url: product.image_url || "",
          unit_type: product.unit_type || "kg",
          unit_value: product.unit_value?.toString() || ""
        })
      } else {
        // Add mode - reset form
        setFormData({
          name: "",
          description: "",
          price: "",
          buying_price: "",
          selling_price: "",
          sku: "",
          category: "",
          stock_quantity: "",
          is_active: true,
          image_url: "",
          unit_type: "kg",
          unit_value: ""
        })
      }
      setErrors({})
    }
  }, [isOpen, product])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required"
    }

    if (!formData.selling_price || isNaN(parseFloat(formData.selling_price)) || parseFloat(formData.selling_price) < 0) {
      newErrors.selling_price = "Valid selling price is required"
    }

    if (formData.buying_price && (isNaN(parseFloat(formData.buying_price)) || parseFloat(formData.buying_price) < 0)) {
      newErrors.buying_price = "Buying price must be a non-negative number"
    }

    if (formData.buying_price && formData.selling_price && 
        parseFloat(formData.buying_price) > parseFloat(formData.selling_price)) {
      newErrors.buying_price = "Buying price cannot be higher than selling price"
    }

    if (formData.stock_quantity && (isNaN(parseInt(formData.stock_quantity)) || parseInt(formData.stock_quantity) < 0)) {
      newErrors.stock_quantity = "Stock quantity must be a non-negative number"
    }

    if (!formData.unit_value || isNaN(parseFloat(formData.unit_value)) || parseFloat(formData.unit_value) <= 0) {
      newErrors.unit_value = "Unit value must be a positive number"
    }

    if (formData.image_url && formData.image_url.trim()) {
      try {
        new URL(formData.image_url)
      } catch {
        newErrors.image_url = "Please enter a valid URL"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const csrf = await fetch("/api/auth/csrf")
        .then((r) => r.json())
        .then((d) => d.csrfToken)

      const payload = {
        ...formData,
        price: parseFloat(formData.selling_price), // For backward compatibility
        buying_price: parseFloat(formData.buying_price) || 0,
        selling_price: parseFloat(formData.selling_price),
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        unit_value: parseFloat(formData.unit_value),
        image_url: formData.image_url.trim() || undefined
      }

      const url = isEditing ? `/api/products/${product.id}` : "/api/products"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrf
        },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const data = await res.json()
        onSuccess(data.product, isEditing ? 'updated' : 'created')
        onClose()
      } else {
        const err = await res.json().catch(() => ({}))
        if (err.details) {
          setErrors(err.details)
        } else {
          alert(err.error || `Failed to ${isEditing ? "update" : "create"} product`)
        }
      }
    } catch (error) {
      alert(`Failed to ${isEditing ? "update" : "create"} product`)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Update product information" : "Create a new product in your catalog"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter product name"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleInputChange("sku", e.target.value)}
                placeholder="Enter SKU"
                className={errors.sku ? "border-destructive" : ""}
              />
              {errors.sku && (
                <p className="text-sm text-destructive">{errors.sku}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter product description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buying_price">Buying Price (Cost)</Label>
              <Input
                id="buying_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.buying_price}
                onChange={(e) => handleInputChange("buying_price", e.target.value)}
                placeholder="0.00"
                className={errors.buying_price ? "border-destructive" : ""}
              />
              {errors.buying_price && (
                <p className="text-sm text-destructive">{errors.buying_price}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="selling_price">Selling Price *</Label>
              <Input
                id="selling_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.selling_price}
                onChange={(e) => handleInputChange("selling_price", e.target.value)}
                placeholder="0.00"
                className={errors.selling_price ? "border-destructive" : ""}
              />
              {errors.selling_price && (
                <p className="text-sm text-destructive">{errors.selling_price}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">

            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Stock Quantity</Label>
              <Input
                id="stock_quantity"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => handleInputChange("stock_quantity", e.target.value)}
                placeholder="0"
                className={errors.stock_quantity ? "border-destructive" : ""}
              />
              {errors.stock_quantity && (
                <p className="text-sm text-destructive">{errors.stock_quantity}</p>
              )}
            </div>
          </div>

          {/* Unit Information Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit_type">Unit Type *</Label>
              <Select value={formData.unit_type} onValueChange={(value) => handleInputChange("unit_type", value)}>
                <SelectTrigger className={errors.unit_type ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select unit type" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unit_type && (
                <p className="text-sm text-destructive">{errors.unit_type}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_value">Unit Value *</Label>
              <Input
                id="unit_value"
                type="number"
                step="0.001"
                min="0.001"
                value={formData.unit_value}
                onChange={(e) => handleInputChange("unit_value", e.target.value)}
                placeholder="1.000"
                className={errors.unit_value ? "border-destructive" : ""}
              />
              {errors.unit_value && (
                <p className="text-sm text-destructive">{errors.unit_value}</p>
              )}
              <p className="text-xs text-muted-foreground">
                e.g., 50 for 50kg, 1 for single items, 250 for 250ml
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select or type category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Or enter new category"
              value={formData.category}
              onChange={(e) => handleInputChange("category", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => handleInputChange("image_url", e.target.value)}
              placeholder="https://example.com/image.jpg"
              className={errors.image_url ? "border-destructive" : ""}
            />
            {errors.image_url && (
              <p className="text-sm text-destructive">{errors.image_url}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange("is_active", checked)}
            />
            <Label htmlFor="is_active">Active Product</Label>
          </div>
        </form>

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
            onClick={handleSubmit} 
            disabled={loading}
          >
            {loading ? "Saving..." : (isEditing ? "Update Product" : "Create Product")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
