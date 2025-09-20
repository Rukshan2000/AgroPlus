"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, Trash2, Plus, Search, QrCode, Package } from "lucide-react"
import AddProductModal from "./add-product-modal"
import DeleteProductModal from "./delete-product-modal"
import RestockProductModal from "./restock-product-modal"
import BarcodeSticker from "./barcode-sticker"
import BulkBarcodeSticker from "./bulk-barcode-sticker"

export default function ProductsTable({ initialProducts = [], initialCategories = [] }) {
  const [products, setProducts] = useState(initialProducts)
  const [categories] = useState(initialCategories)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(false)
  
  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [restockModalOpen, setRestockModalOpen] = useState(false)
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false)
  const [bulkBarcodeModalOpen, setBulkBarcodeModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  const filteredProducts = products.filter(product => {
    const matchesSearch = !search || 
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.description?.toLowerCase().includes(search.toLowerCase()) ||
      product.sku?.toLowerCase().includes(search.toLowerCase())
    
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && product.is_active) ||
      (statusFilter === "inactive" && !product.is_active)

    return matchesSearch && matchesCategory && matchesStatus
  })

  async function deleteProduct(productId) {
    setLoading(true)
    try {
      const csrf = await fetch("/api/auth/csrf")
        .then((r) => r.json())
        .then((d) => d.csrfToken)
      
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json", 
          "x-csrf-token": csrf 
        },
      })

      if (res.ok) {
        setProducts(products.filter(p => p.id !== productId))
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || "Failed to delete product")
      }
    } catch (error) {
      alert("Failed to delete product")
    } finally {
      setLoading(false)
    }
  }

  // Modal handlers
  const handleAddProduct = () => {
    setSelectedProduct(null)
    setAddModalOpen(true)
  }

  const handleEditProduct = (product) => {
    setSelectedProduct(product)
    setEditModalOpen(true)
  }

  const handleDeleteProduct = (product) => {
    setSelectedProduct(product)
    setDeleteModalOpen(true)
  }

  const handleRestockProduct = (product) => {
    setSelectedProduct(product)
    setRestockModalOpen(true)
  }

  const handleBarcodeSticker = (product) => {
    setSelectedProduct(product)
    setBarcodeModalOpen(true)
  }

  const handleBulkBarcodeSticker = () => {
    setBulkBarcodeModalOpen(true)
  }

  const handleProductSuccess = (product, action) => {
    if (action === 'created') {
      setProducts(prev => [product, ...prev])
    } else if (action === 'updated') {
      setProducts(prev => prev.map(p => p.id === product.id ? product : p))
    }
  }

  const handleRestockSuccess = (product) => {
    setProducts(prev => prev.map(p => p.id === product.id ? product : p))
  }

  const handleDeleteSuccess = (productId) => {
    setProducts(prev => prev.filter(p => p.id !== productId))
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Products</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBulkBarcodeSticker}>
            <QrCode className="h-4 w-4 mr-2" />
            Bulk Barcodes
          </Button>
          <Button onClick={handleAddProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Table */}
        <div className="grid gap-2">
          <div className="grid grid-cols-9 text-xs font-medium text-muted-foreground">
            <div>Name</div>
            <div>SKU</div>
            <div>Category</div>
            <div>Price</div>
            <div>Stock</div>
            <div>Status</div>
            <div>Created</div>
            <div>Actions</div>
            <div></div>
          </div>
          {filteredProducts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No products found
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="grid grid-cols-9 items-center py-3 border-b last:border-b-0">
                <div>
                  <div className="font-medium">{product.name}</div>
                  {product.description && (
                    <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {product.description}
                    </div>
                  )}
                </div>
                <div className="text-sm">{product.sku || "-"}</div>
                <div className="text-sm">{product.category || "-"}</div>
                <div className="font-medium">{formatPrice(product.price)}</div>
                <div className="text-sm">
                  <Badge variant={product.stock_quantity > 0 ? "outline" : "destructive"}>
                    {product.stock_quantity}
                  </Badge>
                  {product.unit_value && product.unit_type && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {product.unit_value} {product.unit_type}
                    </div>
                  )}
                </div>
                <div>
                  <Badge variant={product.is_active ? "default" : "secondary"}>
                    {product.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(product.created_at)}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditProduct(product)}
                    title="Edit Product"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleRestockProduct(product)}
                    title="Restock Product"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Package className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={loading}
                    onClick={() => handleDeleteProduct(product)}
                    title="Delete Product"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBarcodeSticker(product)}
                    title="Generate Barcode Sticker"
                  >
                    <QrCode className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleProductSuccess}
        categories={categories}
      />

      {/* Edit Product Modal */}
      <AddProductModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={handleProductSuccess}
        product={selectedProduct}
        categories={categories}
      />

      {/* Delete Product Modal */}
      <DeleteProductModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDeleteSuccess}
        product={selectedProduct}
      />

      {/* Restock Product Modal */}
      <RestockProductModal
        isOpen={restockModalOpen}
        onClose={() => setRestockModalOpen(false)}
        onSuccess={handleRestockSuccess}
        product={selectedProduct}
      />

      {/* Barcode Sticker Modal */}
      <BarcodeSticker
        isOpen={barcodeModalOpen}
        onClose={() => setBarcodeModalOpen(false)}
        product={selectedProduct}
      />

      {/* Bulk Barcode Sticker Modal */}
      <BulkBarcodeSticker
        isOpen={bulkBarcodeModalOpen}
        onClose={() => setBulkBarcodeModalOpen(false)}
        products={filteredProducts}
      />
    </Card>
  )
}
