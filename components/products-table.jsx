"use client"

import { useState, useRef, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, Trash2, Plus, Search, QrCode, Package, Upload, Download, Trash } from "lucide-react"
import AddProductModal from "./add-product-modal"
import DeleteProductModal from "./delete-product-modal"
import RestockProductModal from "./restock-product-modal"
import BarcodeSticker from "./barcode-sticker"
import BulkBarcodeSticker from "./bulk-barcode-sticker"
import Papa from "papaparse"
import { useToast } from "@/hooks/use-toast"

export default function ProductsTable({ initialProducts = [], initialCategories = [] }) {
  const [products, setProducts] = useState(initialProducts)
  const [categories] = useState(initialCategories)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)
  const { toast } = useToast()
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  // Selection state for bulk operations
  const [selectedProducts, setSelectedProducts] = useState(new Set())
  const [selectAll, setSelectAll] = useState(false)
  
  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [restockModalOpen, setRestockModalOpen] = useState(false)
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false)
  const [bulkBarcodeModalOpen, setBulkBarcodeModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Load all products on mount
  useEffect(() => {
    const loadAllProducts = async () => {
      try {
        const response = await fetch("/api/products?limit=1000")
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
        }
      } catch (error) {
        console.error("Failed to load products:", error)
      }
    }

    loadAllProducts()
  }, [])

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

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage)

  // Reset to first page when filters change
  const handleFilterChange = (filterSetter, value) => {
    setCurrentPage(1)
    filterSetter(value)
  }

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts(new Set())
      setSelectAll(false)
    } else {
      const allIds = new Set(filteredProducts.map(p => p.id))
      setSelectedProducts(allIds)
      setSelectAll(true)
    }
  }

  // Handle individual selection
  const handleSelectProduct = (productId) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
    setSelectAll(newSelected.size === filteredProducts.length)
  }

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select products to delete",
        variant: "destructive",
      })
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedProducts.size} product(s)? This action cannot be undone.`)) {
      return
    }

    setLoading(true)
    try {
      const csrf = await fetch("/api/auth/csrf")
      const csrfData = await csrf.json()
      const token = csrfData.csrfToken || csrfData.token

      const response = await fetch("/api/products/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": token,
        },
        body: JSON.stringify({ product_ids: Array.from(selectedProducts) }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete products")
      }

      // Remove deleted products from state
      setProducts(prev => prev.filter(p => !selectedProducts.has(p.id)))
      setSelectedProducts(new Set())
      setSelectAll(false)

      toast({
        title: "Success",
        description: data.message,
      })

      if (data.failed && data.failed.length > 0) {
        console.log("Failed deletions:", data.failed)
        toast({
          title: "Partial Success",
          description: `${data.failedCount} product(s) could not be deleted`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Bulk delete error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

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

  const handleExportCSV = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/products/export")
      
      if (!response.ok) {
        throw new Error("Failed to export products")
      }

      const data = await response.json()
      
      // Convert to CSV
      const csv = Papa.unparse(data.products)
      
      // Create download link
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Success",
        description: `Exported ${data.products.length} products to CSV`,
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Error",
        description: "Failed to export products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImportCSV = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const csrf = await fetch("/api/auth/csrf")
            const csrfData = await csrf.json()
            const token = csrfData.csrfToken || csrfData.token

            const response = await fetch("/api/products/import", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": token,
              },
              body: JSON.stringify({ products: results.data }),
            })

            const data = await response.json()

            if (!response.ok) {
              if (data.validationErrors) {
                toast({
                  title: "Validation Errors",
                  description: `${data.failedCount} rows have errors. Check console for details.`,
                  variant: "destructive",
                })
                console.error("Validation errors:", data.validationErrors)
              } else {
                throw new Error(data.error || "Failed to import products")
              }
            } else {
              toast({
                title: "Import Successful",
                description: `Successfully imported ${data.successCount} products. ${data.failedCount} failed.`,
              })

              if (data.failed && data.failed.length > 0) {
                console.log("Failed imports:", data.failed)
              }

              // Refresh products list
              const productsResponse = await fetch("/api/products?limit=100")
              const productsData = await productsResponse.json()
              setProducts(productsData.products)
            }
          } catch (error) {
            console.error("Import error:", error)
            toast({
              title: "Error",
              description: error.message || "Failed to import products",
              variant: "destructive",
            })
          } finally {
            setLoading(false)
            // Reset file input
            if (fileInputRef.current) {
              fileInputRef.current.value = ''
            }
          }
        },
        error: (error) => {
          console.error("CSV parse error:", error)
          toast({
            title: "Error",
            description: "Failed to parse CSV file",
            variant: "destructive",
          })
          setLoading(false)
        }
      })
    } catch (error) {
      console.error("File handling error:", error)
      toast({
        title: "Error",
        description: "Failed to process file",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const handleDownloadTemplate = () => {
    const template = [
      {
        name: "Urea Fertilizer (1kg)",
        description: "High nitrogen fertilizer for plant growth",
        sku: "PROD-UR-1KG",
        category: "Fertilizers",
        buying_price: "180.00",
        selling_price: "210.00",
        price: "210.00",
        stock_quantity: "200",
        unit_type: "kg",
        unit_value: "1.0",
        minimum_quantity: "10",
        alert_before_days: "7",
        expiry_date: "",
        manufacture_date: "",
        is_active: "true",
        image_url: "",
        batch_number: "BATCH-UR-2026-01"
      },
      {
        name: "Organic Neem Pesticide (500ml)",
        description: "Natural pest control solution for crops and gardens",
        sku: "PROD-NEEM-500ML",
        category: "Pesticides",
        buying_price: "480.00",
        selling_price: "550.00",
        price: "550.00",
        stock_quantity: "200",
        unit_type: "bottles",
        unit_value: "1.0",
        minimum_quantity: "10",
        alert_before_days: "7",
        expiry_date: "",
        manufacture_date: "",
        is_active: "true",
        image_url: "",
        batch_number: "BATCH-NEEM-2026-01"
      },
      {
        name: "Plastic Garden Pots (Medium)",
        description: "Durable plastic pots for home and nursery use",
        sku: "PROD-POT-MED",
        category: "Garden Supplies",
        buying_price: "90.00",
        selling_price: "120.00",
        price: "120.00",
        stock_quantity: "200",
        unit_type: "items",
        unit_value: "1.0",
        minimum_quantity: "20",
        alert_before_days: "7",
        expiry_date: "",
        manufacture_date: "",
        is_active: "true",
        image_url: "",
        batch_number: "BATCH-POT-2026-01"
      }
    ]

    const csv = Papa.unparse(template)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'products_import_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Template Downloaded",
      description: "Simple format - ID is auto-generated, no variations needed",
    })
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
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(price)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          Products
          {selectedProducts.size > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({selectedProducts.size} selected)
            </span>
          )}
        </CardTitle>
        <div className="flex gap-2">
          {selectedProducts.size > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete} 
              disabled={loading}
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete ({selectedProducts.size})
            </Button>
          )}
          <Button variant="outline" onClick={handleDownloadTemplate} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            CSV Template
          </Button>
          <Button variant="outline" onClick={handleImportCSV} disabled={loading}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" onClick={handleExportCSV} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
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
        {/* Hidden file input for CSV import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => handleFilterChange(setSearch, e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={(value) => handleFilterChange(setCategoryFilter, value)}>
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
          <Select value={statusFilter} onValueChange={(value) => handleFilterChange(setStatusFilter, value)}>
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
          <div className="grid grid-cols-10 text-xs font-medium text-muted-foreground">
            <div className="flex items-center">
              <Checkbox
                checked={selectAll}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
              />
            </div>
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
            paginatedProducts.map((product) => (
              <div key={product.id} className="grid grid-cols-10 items-center py-3 border-b last:border-b-0">
                <div className="flex items-center">
                  <Checkbox
                    checked={selectedProducts.has(product.id)}
                    onCheckedChange={() => handleSelectProduct(product.id)}
                    aria-label={`Select ${product.name}`}
                  />
                </div>
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

        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
              >
                Previous
              </Button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    onClick={() => setCurrentPage(page)}
                    disabled={loading}
                    className="min-w-10"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
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
