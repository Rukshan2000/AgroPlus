"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog"
import { Package, DollarSign, Calendar, Tag } from "lucide-react"

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
    unit_value: "",
    expiry_date: "",
    manufacture_date: "",
    alert_before_days: "7",
    minimum_quantity: "5"
  })
  const [errors, setErrors] = useState({})
  const [priceVariations, setPriceVariations] = useState([])
  const [newVariation, setNewVariation] = useState({
    variant_name: "",
    price: "",
    buying_price: "",
    is_default: false
  })
  const [activeTab, setActiveTab] = useState("basic")

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
          unit_value: product.unit_value?.toString() || "",
          expiry_date: product.expiry_date ? product.expiry_date.split('T')[0] : "",
          manufacture_date: product.manufacture_date ? product.manufacture_date.split('T')[0] : "",
          alert_before_days: product.alert_before_days?.toString() || "7",
          minimum_quantity: product.minimum_quantity?.toString() || "5"
        })
        
        // Fetch existing price variations
        if (product.id) {
          fetchPriceVariations(product.id)
        }
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
          unit_value: "",
          expiry_date: "",
          manufacture_date: "",
          alert_before_days: "7",
          minimum_quantity: "5"
        })
        setPriceVariations([])
      }
      setErrors({})
      setNewVariation({
        variant_name: "",
        price: "",
        buying_price: "",
        is_default: false
      })
    }
  }, [isOpen, product])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const fetchPriceVariations = async (productId) => {
    try {
      const res = await fetch(`/api/products/${productId}/price-variations`)
      if (res.ok) {
        const data = await res.json()
        setPriceVariations(data.variations || [])
      }
    } catch (error) {
      console.error('Failed to fetch price variations:', error)
    }
  }

  const handleAddVariation = () => {
    if (!newVariation.variant_name || !newVariation.price) {
      alert("Please enter variant name and price")
      return
    }

    setPriceVariations([...priceVariations, {
      ...newVariation,
      price: parseFloat(newVariation.price),
      buying_price: parseFloat(newVariation.buying_price) || 0,
      id: Date.now() // Temporary ID for new variations
    }])

    setNewVariation({
      variant_name: "",
      price: "",
      buying_price: "",
      is_default: false
    })
  }

  const handleRemoveVariation = (index) => {
    setPriceVariations(priceVariations.filter((_, i) => i !== index))
  }

  const handleToggleDefault = (index) => {
    setPriceVariations(priceVariations.map((v, i) => ({
      ...v,
      is_default: i === index
    })))
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

    // Validate expiry and manufacture dates
    if (formData.expiry_date && formData.manufacture_date) {
      const expiryDate = new Date(formData.expiry_date)
      const manufactureDate = new Date(formData.manufacture_date)
      
      if (manufactureDate >= expiryDate) {
        newErrors.expiry_date = "Expiry date must be after manufacture date"
      }
    }

    if (formData.manufacture_date) {
      const manufactureDate = new Date(formData.manufacture_date)
      const today = new Date()
      
      if (manufactureDate > today) {
        newErrors.manufacture_date = "Manufacture date cannot be in the future"
      }
    }

    if (formData.alert_before_days && (isNaN(parseInt(formData.alert_before_days)) || parseInt(formData.alert_before_days) < 1)) {
      newErrors.alert_before_days = "Alert days must be a positive number"
    }

    if (formData.minimum_quantity && (isNaN(parseInt(formData.minimum_quantity)) || parseInt(formData.minimum_quantity) < 0)) {
      newErrors.minimum_quantity = "Minimum quantity must be a non-negative number"
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
        image_url: formData.image_url.trim() || undefined,
        expiry_date: formData.expiry_date || null,
        manufacture_date: formData.manufacture_date || null,
        alert_before_days: parseInt(formData.alert_before_days) || 7,
        minimum_quantity: parseInt(formData.minimum_quantity) || 5
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
        
        // If we have price variations, save them
        if (priceVariations.length > 0) {
          const productId = isEditing ? product.id : data.product.id
          
          // Delete existing variations and create new ones
          if (isEditing) {
            const existingVariations = await fetch(`/api/products/${productId}/price-variations`)
              .then(r => r.json())
              .then(d => d.variations || [])
            
            for (const variation of existingVariations) {
              await fetch(`/api/products/${productId}/price-variations/${variation.id}`, {
                method: 'DELETE',
                headers: {
                  'x-csrf-token': csrf
                }
              })
            }
          }
          
          // Create new variations
          const variationsPayload = priceVariations.map(v => ({
            variant_name: v.variant_name,
            price: parseFloat(v.price),
            buying_price: parseFloat(v.buying_price) || 0,
            is_default: v.is_default || false,
            is_active: true,
            stock_quantity: 0,
            sort_order: 0
          }))

          await fetch(`/api/products/${productId}/price-variations?bulk=true`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-csrf-token': csrf
            },
            body: JSON.stringify({ variations: variationsPayload })
          })
        }
        
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isEditing ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Update product information" : "Create a new product in your catalog"}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Basic Info</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Pricing</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="variations" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Variations</span>
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="mt-6">
            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4 mt-0">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU / Product Code</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
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
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Enter detailed product description"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Product Image URL</Label>
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

              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                />
                <Label htmlFor="is_active" className="cursor-pointer">Active Product (visible in catalog)</Label>
              </div>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-4 mt-0">

              <div className="space-y-4 bg-muted/30 p-4 rounded-lg border">
                <h3 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Default Pricing
                </h3>
                
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
                    <p className="text-xs text-muted-foreground">How much you pay for this product</p>
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
                    <p className="text-xs text-muted-foreground">Price you sell to customers</p>
                  </div>
                </div>

                {formData.buying_price && formData.selling_price && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Profit Margin: LKR {(parseFloat(formData.selling_price) - parseFloat(formData.buying_price)).toFixed(2)}
                      {' '}({((parseFloat(formData.selling_price) - parseFloat(formData.buying_price)) / parseFloat(formData.selling_price) * 100).toFixed(1)}%)
                    </p>
                  </div>
                )}
              </div>

              <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                <p className="font-medium text-blue-900 dark:text-blue-200 mb-1">💡 Tip:</p>
                <p className="text-blue-800 dark:text-blue-300">Want multiple price options? Use the "Variations" tab to add different pricing tiers (e.g., wholesale, retail, bulk pricing).</p>
              </div>
            </TabsContent>

            {/* Inventory Management Tab */}
            <TabsContent value="inventory" className="space-y-4 mt-0">

              {/* Stock Information */}
              <div className="space-y-4 bg-muted/30 p-4 rounded-lg border">
                <h3 className="font-semibold">Stock Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock_quantity">Current Stock Quantity</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="minimum_quantity">Low Stock Alert Level</Label>
                    <Input
                      id="minimum_quantity"
                      type="number"
                      min="0"
                      value={formData.minimum_quantity}
                      onChange={(e) => handleInputChange("minimum_quantity", e.target.value)}
                      placeholder="5"
                      className={errors.minimum_quantity ? "border-destructive" : ""}
                    />
                    {errors.minimum_quantity && (
                      <p className="text-sm text-destructive">{errors.minimum_quantity}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Alert when stock falls below this level
                    </p>
                  </div>
                </div>
              </div>

              {/* Unit Information */}
              <div className="space-y-4 bg-muted/30 p-4 rounded-lg border">
                <h3 className="font-semibold">Unit Measurement</h3>
                
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
                      e.g., 50 for 50kg, 250 for 250ml, 1 for single items
                    </p>
                  </div>
                </div>
              </div>

              {/* Expiry Tracking */}
              <div className="space-y-4 bg-muted/30 p-4 rounded-lg border">
                <h3 className="font-semibold">Expiry Tracking (Optional)</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manufacture_date">Manufacture Date</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="expiry_date">Expiry Date</Label>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alert_before_days">Expiry Alert (Days Before)</Label>
                  <Input
                    id="alert_before_days"
                    type="number"
                    min="1"
                    value={formData.alert_before_days}
                    onChange={(e) => handleInputChange("alert_before_days", e.target.value)}
                    placeholder="7"
                    className={errors.alert_before_days ? "border-destructive" : ""}
                  />
                  {errors.alert_before_days && (
                    <p className="text-sm text-destructive">{errors.alert_before_days}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Get notified this many days before product expires
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Price Variations Tab */}
            <TabsContent value="variations" className="space-y-4 mt-0">

              <div className="space-y-2 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Multiple Price Options
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Create different pricing tiers for this product. Perfect for wholesale/retail pricing, different pack sizes, or quantity-based pricing.
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
                  Example: Urea 50kg Bag → Add "10 LKR per kg" and "20 LKR per kg" variations
                </p>
              </div>
            
              {/* Existing Variations */}
              {priceVariations.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Current Price Variations ({priceVariations.length})</Label>
                  <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
                  {priceVariations.map((variation, index) => (
                    <div key={variation.id || index} className="flex items-center justify-between p-3 hover:bg-muted/50">
                      <div className="flex-1">
                        <div className="font-medium">{variation.variant_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Price: LKR {parseFloat(variation.price).toFixed(2)}
                          {variation.buying_price > 0 && ` | Cost: LKR ${parseFloat(variation.buying_price).toFixed(2)}`}
                          {variation.is_default && <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">Default</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!variation.is_default && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleDefault(index)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveVariation(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Variation */}
              <div className="space-y-3 border-2 border-dashed rounded-lg p-4 bg-muted/30">
                <Label className="text-base font-semibold">Add New Price Variation</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="variant_name">Variant Name *</Label>
                    <Input
                      id="variant_name"
                      value={newVariation.variant_name}
                      onChange={(e) => setNewVariation({...newVariation, variant_name: e.target.value})}
                      placeholder="e.g., Wholesale, Retail, Bulk"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="variant_price">Selling Price (LKR) *</Label>
                    <Input
                      id="variant_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newVariation.price}
                      onChange={(e) => setNewVariation({...newVariation, price: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="variant_buying_price">Cost (LKR)</Label>
                    <Input
                      id="variant_buying_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newVariation.buying_price}
                      onChange={(e) => setNewVariation({...newVariation, buying_price: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="variant_is_default"
                      checked={newVariation.is_default}
                      onChange={(e) => setNewVariation({...newVariation, is_default: e.target.checked})}
                      className="rounded"
                    />
                    <Label htmlFor="variant_is_default" className="text-sm font-normal cursor-pointer">
                      Set as default price (shown first in POS)
                    </Label>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddVariation}
                    size="sm"
                  >
                    + Add Variation
                  </Button>
                </div>
              </div>

              {priceVariations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Tag className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No price variations added yet</p>
                  <p className="text-xs mt-1">Add variations to offer multiple pricing options</p>
                </div>
              )}
            </TabsContent>
          </form>
        </Tabs>

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
