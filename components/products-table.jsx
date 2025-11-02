"use client"

import { useState, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, Trash2, Plus, Search, QrCode, Package, Upload, Download, Trash, ChevronLeft, ChevronRight } from "lucide-react"
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
  
  // Selection state for bulk operations
  const [selectedProducts, setSelectedProducts] = useState(new Set())
  const [selectAll, setSelectAll] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
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

  // Pagination calculations
  const totalItems = filteredProducts.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProducts = filteredProducts.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useState(() => {
    setCurrentPage(1)
  }, [search, categoryFilter, statusFilter, itemsPerPage])

  // Handle select all for current page
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts(new Set())
      setSelectAll(false)
    } else {
      const currentPageIds = new Set(currentProducts.map(p => p.id))
      setSelectedProducts(currentPageIds)
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
    setSelectAll(newSelected.size === currentProducts.length)
  }

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1)
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      const startPage = Math.max(1, currentPage - 2)
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
    }
    
    return pages
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
        name: "Rice - Basmati",
        description: "Premium quality basmati rice",
        sku: "RICE-001",
        category: "Grains",
        buying_price: "100.00",
        selling_price: "150.00",
        price: "150.00",
        stock_quantity: "50",
        unit_type: "kg",
        unit_value: "1.0",
        minimum_quantity: "5",
        alert_before_days: "7",
        expiry_date: "",
        manufacture_date: "",
        is_active: "true",
        image_url: "",
        // Variation 1: Small pack
        variant_1_name: "Small (500g)",
        variant_1_price: "75",
        variant_1_buying_price: "50",
        variant_1_stock: "100",
        variant_1_sku_suffix: "500G",
        variant_1_is_default: "yes",
        // Variation 2: Medium pack
        variant_2_name: "Medium (1kg)",
        variant_2_price: "150",
        variant_2_buying_price: "100",
        variant_2_stock: "50",
        variant_2_sku_suffix: "1KG",
        variant_2_is_default: "",
        // Variation 3: Large pack
        variant_3_name: "Large (5kg)",
        variant_3_price: "700",
        variant_3_buying_price: "480",
        variant_3_stock: "20",
        variant_3_sku_suffix: "5KG",
        variant_3_is_default: "",
        // Empty variations 4 & 5
        variant_4_name: "",
        variant_4_price: "",
        variant_4_buying_price: "",
        variant_4_stock: "",
        variant_4_sku_suffix: "",
        variant_4_is_default: "",
        variant_5_name: "",
        variant_5_price: "",
        variant_5_buying_price: "",
        variant_5_stock: "",
        variant_5_sku_suffix: "",
        variant_5_is_default: ""
      },
      {
        name: "Coconut Oil",
        description: "Pure coconut oil - no variations",
        sku: "OIL-001",
        category: "Oils",
        buying_price: "200.00",
        selling_price: "250.00",
        price: "250.00",
        stock_quantity: "30",
        unit_type: "l",
        unit_value: "1.0",
        minimum_quantity: "10",
        alert_before_days: "7",
        expiry_date: "",
        manufacture_date: "",
        is_active: "true",
        image_url: "",
        // No variations for this product
        variant_1_name: "",
        variant_1_price: "",
        variant_1_buying_price: "",
        variant_1_stock: "",
        variant_1_sku_suffix: "",
        variant_1_is_default: "",
        variant_2_name: "",
        variant_2_price: "",
        variant_2_buying_price: "",
        variant_2_stock: "",
        variant_2_sku_suffix: "",
        variant_2_is_default: "",
        variant_3_name: "",
        variant_3_price: "",
        variant_3_buying_price: "",
        variant_3_stock: "",
        variant_3_sku_suffix: "",
        variant_3_is_default: "",
        variant_4_name: "",
        variant_4_price: "",
        variant_4_buying_price: "",
        variant_4_stock: "",
        variant_4_sku_suffix: "",
        variant_4_is_default: "",
        variant_5_name: "",
        variant_5_price: "",
        variant_5_buying_price: "",
        variant_5_stock: "",
        variant_5_sku_suffix: "",
        variant_5_is_default: ""
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
      description: "Easy format - just fill in the columns for each price variation",
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
          <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Items per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="25">25 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
              <SelectItem value="100">100 per page</SelectItem>
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
          {currentProducts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No products found
            </div>
          ) : (
            currentProducts.map((product) => (
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} products
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {getPageNumbers().map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
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