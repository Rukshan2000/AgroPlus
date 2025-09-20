"use client"

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Search, Leaf, Star, Eye, Package, TrendingUp, X } from 'lucide-react'
import Image from "next/image"
import Link from 'next/link'

interface Product {
  id: number
  name: string
  description: string
  selling_price: number
  category: string
  image_url: string
  unit_type: string
  unit_value: number
  stock_quantity: number
  sku: string
}

interface Category {
  id: number
  name: string
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [productsRes, categoriesRes] = await Promise.all([
        fetch("/api/website/products?limit=50"),
        fetch("/api/website/categories"),
      ])
      if (!productsRes.ok || !categoriesRes.ok) throw new Error("Failed to fetch")
      const productsData = await productsRes.json()
      const categoriesData = await categoriesRes.json()
      setProducts(productsData.products || [])
      setCategories(categoriesData.categories || [])
    } catch (err) {
      console.error(err)
      setError("Failed to load products.")
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price)

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter(p => p.category?.toLowerCase() === selectedCategory)

  const searchFilteredProducts = searchTerm
    ? filteredProducts.filter(
        p =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredProducts

  const handleSearch = (term: string) => setSearchTerm(term)
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat)
    setSearchTerm("")
  }

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedProduct(null)
  }

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { text: "Out of Stock", variant: "destructive" as const, color: "bg-red-100 text-red-800" }
    if (quantity <= 10) return { text: "Low Stock", variant: "secondary" as const, color: "bg-orange-100 text-orange-800" }
    return { text: "In Stock", variant: "default" as const, color: "bg-green-100 text-green-800" }
  }

  const ProductCard = ({ product }: { product: Product }) => {
    const stockStatus = getStockStatus(product.stock_quantity)
    
    return (
      <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-t-lg">
          <Image
            src={product.image_url || "/placeholder.jpg"}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            onErrorCapture={(e) => (e.currentTarget.src = "/placeholder.jpg")}
            unoptimized
          />
          
          {/* Stock Badge */}
          <Badge 
            className={`absolute top-3 right-3 ${stockStatus.color} border-0`}
          >
            {stockStatus.text}
          </Badge>

          {/* Category Badge */}
          <Badge 
            variant="outline" 
            className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border-white/20"
          >
            {product.category}
          </Badge>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/90 hover:bg-white text-gray-900 backdrop-blur-sm"
              onClick={() => handleViewProduct(product)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-bold line-clamp-2 group-hover:text-green-600 transition-colors">
                {product.name}
              </CardTitle>
              <CardDescription className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                {product.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          {/* Price Section */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-green-600">
                {formatPrice(product.selling_price)}
              </span>
              <span className="text-sm text-gray-500 ml-1">
                per {product.unit_type}
              </span>
            </div>
            <div className="text-right">
              <div className="flex items-center text-sm text-gray-500">
                <Package className="h-4 w-4 mr-1" />
                {product.stock_quantity} units
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium">SKU:</span>
              <span className="ml-1 font-mono">{product.sku}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <Star className="h-4 w-4 fill-gray-200 text-gray-200" />
              <span className="text-xs text-gray-500 ml-1">(4.2)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Product Details Modal Component
  const ProductDetailsModal = () => {
    if (!selectedProduct) return null
    
    const stockStatus = getStockStatus(selectedProduct.stock_quantity)
    
    return (
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Product Details
              </DialogTitle>
              <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-8 py-6">
            {/* Product Image */}
            <div className="space-y-4">
              <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                <Image
                  src={selectedProduct.image_url || "/placeholder.jpg"}
                  alt={selectedProduct.name}
                  fill
                  className="object-cover"
                  onErrorCapture={(e) => (e.currentTarget.src = "/placeholder.jpg")}
                  unoptimized
                />
                <Badge 
                  className={`absolute top-4 right-4 ${stockStatus.color} border-0`}
                >
                  {stockStatus.text}
                </Badge>
              </div>
              
              {/* Additional Product Images Placeholder */}
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-md relative overflow-hidden">
                    <Image
                      src={selectedProduct.image_url || "/placeholder.jpg"}
                      alt={`${selectedProduct.name} view ${i}`}
                      fill
                      className="object-cover opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                      onErrorCapture={(e) => (e.currentTarget.src = "/placeholder.jpg")}
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <Badge variant="outline" className="mb-3">
                  {selectedProduct.category}
                </Badge>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  {selectedProduct.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  {selectedProduct.description}
                </p>
              </div>

              {/* Price and Rating */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="text-4xl font-bold text-green-600">
                    {formatPrice(selectedProduct.selling_price)}
                  </span>
                  <span className="text-lg text-gray-500">
                    per {selectedProduct.unit_type}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= 4 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'fill-gray-200 text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-600 dark:text-gray-400">(4.2) • 128 reviews</span>
                </div>
              </div>

              {/* Product Details */}
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">SKU</span>
                    <p className="font-mono text-gray-900 dark:text-white">{selectedProduct.sku}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Stock</span>
                    <p className="text-gray-900 dark:text-white">{selectedProduct.stock_quantity} units</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Unit Value</span>
                    <p className="text-gray-900 dark:text-white">{selectedProduct.unit_value} {selectedProduct.unit_type}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Availability</span>
                    <p className={`font-medium ${stockStatus.text === 'In Stock' ? 'text-green-600' : stockStatus.text === 'Low Stock' ? 'text-orange-600' : 'text-red-600'}`}>
                      {stockStatus.text}
                    </p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Product Features</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>100% Organic & Natural</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Locally Sourced</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Farm Fresh Quality</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Sustainable Packaging</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Package className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Oops! Something went wrong</h3>
            <p className="text-red-500 mb-6">{error}</p>
            <Button onClick={fetchData} className="bg-green-600 hover:bg-green-700">
              <TrendingUp className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Enhanced Header */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 dark:from-green-950/20 dark:via-blue-950/20 dark:to-emerald-950/20">
        <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-5"></div>
        <div className="container mx-auto text-center relative">
          <Badge variant="outline" className="mb-6 border-green-200 text-green-700 px-4 py-1.5">
            <Leaf className="h-4 w-4 mr-2" /> 
            Fresh • Organic • Premium Quality
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-6">
            Shop AgroPlus
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Discover our carefully curated selection of premium organic and farm-fresh products. 
            Quality guaranteed, sustainability prioritized.
          </p>
          
          {/* Enhanced Search */}
          <div className="max-w-xl mx-auto">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-green-500 transition-colors" />
              <Input
                type="text"
                placeholder="Search products, categories, or SKU..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-12 pr-4 py-4 w-full border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 shadow-lg transition-all text-lg"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-12 max-w-lg mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{products.length}+</div>
              <div className="text-sm text-gray-600">Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{categories.length}+</div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">100%</div>
              <div className="text-sm text-gray-600">Organic</div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Categories */}
      <section className="py-12 px-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto">
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => handleCategoryChange("all")}
              className={`rounded-full px-6 py-2.5 transition-all ${
                selectedCategory === "all" 
                  ? "bg-green-600 hover:bg-green-700 shadow-lg scale-105" 
                  : "hover:bg-green-50 hover:border-green-200"
              }`}
            >
              All Products ({products.length})
            </Button>
            {categories.map((cat) => {
              const categoryCount = products.filter(p => p.category?.toLowerCase() === cat.name.toLowerCase()).length
              return (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.name.toLowerCase() ? "default" : "outline"}
                  onClick={() => handleCategoryChange(cat.name.toLowerCase())}
                  className={`rounded-full px-6 py-2.5 transition-all ${
                    selectedCategory === cat.name.toLowerCase()
                      ? "bg-green-600 hover:bg-green-700 shadow-lg scale-105"
                      : "hover:bg-green-50 hover:border-green-200"
                  }`}
                >
                  {cat.name} ({categoryCount})
                </Button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Enhanced Products Grid */}
      <section className="py-16 px-4 bg-gray-50/50 dark:bg-gray-950/50">
        <div className="container mx-auto">
          {!loading && (
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {searchTerm ? `Search Results` : selectedCategory === "all" ? "All Products" : categories.find(c => c.name.toLowerCase() === selectedCategory)?.name}
                <span className="text-lg font-normal text-gray-500 ml-2">
                  ({searchFilteredProducts.length} items)
                </span>
              </h2>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="h-80 animate-pulse">
                    <div className="aspect-square bg-gray-200 dark:bg-gray-800 rounded-t-lg" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                      <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                    </div>
                  </Card>
                ))
              : searchFilteredProducts.length === 0 ? (
                  <div className="col-span-full text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Package className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      No products found
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Try adjusting your search or browse different categories
                    </p>
                    <Button
                      onClick={() => {
                        setSearchTerm("")
                        setSelectedCategory("all")
                      }}
                      variant="outline"
                    >
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  searchFilteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))
                )}
          </div>
        </div>
      </section>


      {/* Enhanced Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <Leaf className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold">AgroPlus</span>
              </div>
              <p className="text-gray-400 mb-6 text-lg leading-relaxed">
                Your trusted partner for fresh, organic agricultural products. 
                We're committed to sustainable farming and premium quality.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors cursor-pointer">
                  📘
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors cursor-pointer">
                  📷
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors cursor-pointer">
                  🐦
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-6 text-lg">Quick Links</h3>
              <ul className="space-y-3">
                <li><Link href="/" className="text-gray-400 hover:text-green-400 transition-colors">Home</Link></li>
                <li><Link href="/about" className="text-gray-400 hover:text-green-400 transition-colors">About</Link></li>
                <li><Link href="/shop" className="text-gray-400 hover:text-green-400 transition-colors">Shop</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-green-400 transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-6 text-lg">Contact Info</h3>
              <div className="space-y-4 text-gray-400">
                <div className="flex items-center space-x-3">
                  <span className="text-green-400">📞</span>
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-green-400">✉️</span>
                  <span>info@agroplus.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-green-400">📍</span>
                  <span>123 Farm Road, Green Valley</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 AgroPlus. All rights reserved. Created by Rukshan Tharindu</p>
          </div>
        </div>
      </footer>

      {/* Product Details Modal */}
      <ProductDetailsModal />

      <Toaster />
    </div>
  )
}