"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Package, 
  Search, 
  Plus, 
  Save, 
  X, 
  Check, 
  Edit2, 
  Loader2,
  ChevronRight
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Default units fallback
const DEFAULT_UNITS = [
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "g", label: "Grams (g)" },
  { value: "l", label: "Liters (l)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "m", label: "Meters (m)" },
  { value: "box", label: "Boxes" },
  { value: "pack", label: "Packs" },
]

export default function QuickProductPage() {
  const { toast } = useToast()
  const nameInputRef = useRef(null)
  
  // State
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [units, setUnits] = useState(DEFAULT_UNITS)
  const [products, setProducts] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showProductList, setShowProductList] = useState(false)
  
  // Form state - minimal fields for quick entry
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    buying_price: "",
    selling_price: "",
    stock_quantity: "",
    unit_type: "pcs",
    unit_value: "1",
    is_active: true,
    return: true
  })
  const [errors, setErrors] = useState({})

  // Fetch categories and units on mount
  useEffect(() => {
    fetchCategories()
    fetchUnits()
  }, [])

  // Search products when query changes
  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchProducts(searchQuery)
    } else {
      setProducts([])
      setShowProductList(false)
    }
  }, [searchQuery])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchUnits = async () => {
    try {
      const res = await fetch('/api/products/units')
      if (res.ok) {
        const data = await res.json()
        if (data.units && data.units.length > 0) {
          setUnits(data.units)
        } else {
          // Keep default units if API returns empty
          setUnits(DEFAULT_UNITS)
        }
      } else {
        // Keep default units if API fails
        setUnits(DEFAULT_UNITS)
      }
    } catch (error) {
      console.error('Failed to fetch units:', error)
      // Keep default units on error
      setUnits(DEFAULT_UNITS)
    }
  }

  const searchProducts = async (query) => {
    setSearchLoading(true)
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=10`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
        setShowProductList(true)
      }
    } catch (error) {
      console.error('Failed to search products:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const selectProduct = (product) => {
    setSelectedProduct(product)
    setFormData({
      name: product.name || "",
      category: product.category || "",
      buying_price: product.buying_price?.toString() || "",
      selling_price: product.selling_price?.toString() || product.price?.toString() || "",
      stock_quantity: product.stock_quantity?.toString() || "",
      unit_type: product.unit_type || "pcs",
      unit_value: product.unit_value?.toString() || "1",
      is_active: product.is_active !== false,
      return: product.return !== false
    })
    setShowProductList(false)
    setSearchQuery("")
  }

  const clearForm = () => {
    setSelectedProduct(null)
    setFormData({
      name: "",
      category: "",
      buying_price: "",
      selling_price: "",
      stock_quantity: "",
      unit_type: "pcs",
      unit_value: "1",
      is_active: true,
      return: true
    })
    setErrors({})
    setSearchQuery("")
    nameInputRef.current?.focus()
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name required"
    }

    if (!formData.selling_price || parseFloat(formData.selling_price) < 0) {
      newErrors.selling_price = "Price required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const csrf = await fetch("/api/auth/csrf")
        .then(r => r.json())
        .then(d => d.csrfToken)

      const payload = {
        name: formData.name.trim(),
        category: formData.category || undefined,
        buying_price: parseFloat(formData.buying_price) || 0,
        selling_price: parseFloat(formData.selling_price),
        price: parseFloat(formData.selling_price),
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        unit_type: formData.unit_type,
        unit_value: parseFloat(formData.unit_value) || 1,
        is_active: formData.is_active,
        return: formData.return
      }

      const isEditing = !!selectedProduct
      const url = isEditing ? `/api/products/${selectedProduct.id}` : "/api/products"
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
        toast({
          title: "Success",
          description: isEditing ? "Product updated!" : "Product created!",
        })
        clearForm()
      } else {
        const err = await res.json().catch(() => ({}))
        toast({
          title: "Error",
          description: err.error || "Failed to save product",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-28">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Quick Product
          </h1>
          {selectedProduct && (
            <Badge variant="secondary" className="text-xs">
              <Edit2 className="h-3 w-3 mr-1" />
              Editing
            </Badge>
          )}
        </div>
      </div>

      <div className="px-3 py-3 space-y-3">
        {/* Search Box */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search product to edit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-12 text-base rounded-xl"
            />
            {searchLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          
          {/* Search Results Dropdown */}
          {showProductList && (
            <div className="absolute left-0 right-0 top-full mt-1 border rounded-xl divide-y max-h-64 overflow-y-auto bg-background shadow-lg z-50">
              {products.length > 0 ? (
                products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => selectProduct(product)}
                    className="w-full flex items-center justify-between p-3 hover:bg-muted/50 active:bg-muted transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Rs. {product.selling_price || product.price} • Stock: {product.stock_quantity || 0}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                  </button>
                ))
              ) : !searchLoading ? (
                <div className="text-center text-sm text-muted-foreground py-4">
                  No products found
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* New Product Button when editing */}
        {selectedProduct && (
          <Button 
            variant="outline" 
            className="w-full h-11 rounded-xl"
            onClick={clearForm}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Product Instead
          </Button>
        )}

        {/* Main Form */}
        <Card className="rounded-xl border-0 shadow-sm bg-card">
          <CardContent className="p-4 space-y-4">
            {/* Product Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Product Name *</Label>
              <Input
                ref={nameInputRef}
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter product name"
                className={`h-12 text-base rounded-xl ${errors.name ? "border-destructive" : ""}`}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger className="h-12 text-base rounded-xl">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pricing - 2 columns */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Buying Price</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={formData.buying_price}
                  onChange={(e) => handleInputChange("buying_price", e.target.value)}
                  placeholder="0.00"
                  className="h-12 text-base rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selling Price *</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={formData.selling_price}
                  onChange={(e) => handleInputChange("selling_price", e.target.value)}
                  placeholder="0.00"
                  className={`h-12 text-base rounded-xl ${errors.selling_price ? "border-destructive" : ""}`}
                />
              </div>
            </div>

            {/* Stock & Unit - Full width sections */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Stock Qty</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={formData.stock_quantity}
                    onChange={(e) => handleInputChange("stock_quantity", e.target.value)}
                    placeholder="0"
                    className="h-11 text-sm rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Unit Value</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={formData.unit_value}
                    onChange={(e) => handleInputChange("unit_value", e.target.value)}
                    placeholder="1"
                    className="h-11 text-sm rounded-xl"
                  />
                </div>
              </div>
              
              {/* Unit Type - Full width for better dropdown */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Unit Type</Label>
                <Select
                  value={formData.unit_type}
                  onValueChange={(value) => handleInputChange("unit_type", value)}
                >
                  <SelectTrigger className="h-12 text-sm rounded-xl w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    {units && units.length > 0 ? (
                      units.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem disabled value="">No units available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Toggle Switches - compact */}
            <div className="flex gap-4 pt-2">
              <div className="flex items-center gap-2 flex-1">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                />
                <Label htmlFor="is_active" className="text-sm">Active</Label>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Switch
                  id="return"
                  checked={formData.return}
                  onCheckedChange={(checked) => handleInputChange("return", checked)}
                />
                <Label htmlFor="return" className="text-sm">Returns</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 h-12 text-base rounded-xl"
            onClick={clearForm}
            disabled={loading}
          >
            <X className="h-5 w-5 mr-1" />
            Clear
          </Button>
          <Button
            className="flex-[2] h-12 text-base rounded-xl"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 mr-1 animate-spin" />
            ) : selectedProduct ? (
              <Check className="h-5 w-5 mr-1" />
            ) : (
              <Save className="h-5 w-5 mr-1" />
            )}
            {loading ? "Saving..." : selectedProduct ? "Update" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}
