'use client'

import React, { useState, useEffect } from 'react'
import { ShoppingCart, CheckCircle, LogOut, Undo2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useSession } from '@/hooks/use-session'
import ProductInput from '@/components/pos/ProductInput'
import Cart from '@/components/pos/Cart'
import Receipt from '@/components/pos/Receipt'
import ThermalReceipt from '@/components/pos/ThermalReceipt'
import PriceVariationModal from '@/components/pos/price-variation-modal'
import POSReturnModal from '@/components/pos-return-modal'
import { Button } from '@/components/ui/button'
import { ConnectionStatusBadge } from '@/components/connection-status'
import offlineProductModel from '@/models/offlineProductModel'
import offlineSalesModel from '@/models/offlineSalesModel'

export default function POSSystem() {
  const [cart, setCart] = useState([])
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [discount, setDiscount] = useState('')
  const [showBill, setShowBill] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [productSearch, setProductSearch] = useState('')
  const [filteredProducts, setFilteredProducts] = useState([])
  const [sortBy, setSortBy] = useState('popularity') // New sorting state
  const [sortOrder, setSortOrder] = useState('desc') // New sort order state
  const [sessionTime, setSessionTime] = useState(0) // Timer state
  const [showPriceVariationModal, setShowPriceVariationModal] = useState(false)
  const [selectedProductForVariation, setSelectedProductForVariation] = useState(null)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [saleId, setSaleId] = useState(null) // Store sale ID for receipt
  const { toast } = useToast()
  const { session } = useSession()

  const handleLogout = async () => {
    try {
      // include CSRF header for logout
      const csrf = await fetch("/api/auth/csrf")
        .then((r) => r.json())
        .then((d) => d.csrfToken)
      await fetch("/api/auth/logout", { method: "POST", headers: { "x-csrf-token": csrf } })
      window.location.href = "/login"
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive"
      })
    }
  }

  // Load products on component mount
  useEffect(() => {
    loadProducts()
  }, [])

  // Session timer effect
  useEffect(() => {
    if (session?.user) {
      const timer = setInterval(() => {
        setSessionTime(prev => prev + 1)
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [session?.user])

  // Format session time
  const formatSessionTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Filter and sort products based on search and sorting options
  useEffect(() => {
    let productsToShow = products
    
    if (productSearch) {
      productsToShow = products.filter(product => 
        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.sku?.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.id.toString().includes(productSearch)
      )
    } else {
      productsToShow = products.slice(0, 24) // Limit to 24 for performance
    }
    
    // Apply sorting
    const sortedProducts = sortProducts(productsToShow, sortBy, sortOrder)
    setFilteredProducts(sortedProducts)
  }, [productSearch, products, sortBy, sortOrder])

  const loadProducts = async () => {
    try {
      // Try offline first, then fallback to API if online
      const offlineResult = await offlineProductModel.findAll({ limit: 100 });
      
      if (offlineResult.success && offlineResult.products.length > 0) {
        // Filter active products
        const activeProducts = offlineResult.products.filter(p => p.is_active !== false);
        setProducts(activeProducts);
      } else {
        // Fallback to API if no offline data
        const response = await fetch('/api/products?limit=100&is_active=true');
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      })
    }
  }

  const findProduct = (id) => {
    return products.find(p => p.id.toString() === id || p.sku === id)
  }

  const getProductPrice = (product) => {
    return parseFloat(product.price) || 0
  }

  // Sorting function
  const sortProducts = (products, sortBy, sortOrder) => {
    const sorted = [...products].sort((a, b) => {
      let comparison = 0
      
      switch(sortBy) {
        case 'popularity':
          comparison = (b.sold_quantity || 0) - (a.sold_quantity || 0)
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'price':
          comparison = getProductPrice(a) - getProductPrice(b)
          break
        case 'stock':
          comparison = (a.available_quantity || 0) - (b.available_quantity || 0)
          break
        case 'sku':
          comparison = (a.sku || '').localeCompare(b.sku || '')
          break
        default:
          comparison = 0
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return sorted
  }

  const addToCart = async () => {
    const product = findProduct(productId)
    if (!product || !productId) {
      toast({
        title: "Product not found",
        description: "Please check the product ID or SKU",
        variant: "destructive"
      })
      // Focus back to product input
      setTimeout(() => {
        document.querySelector('input[placeholder="Scan or type product..."]')?.focus()
      }, 100)
      return
    }

    if (product.available_quantity <= 0) {
      toast({
        title: "Out of stock",
        description: `${product.name} is currently out of stock`,
        variant: "destructive"
      })
      setProductId('')
      setTimeout(() => {
        document.querySelector('input[placeholder="Scan or type product..."]')?.focus()
      }, 100)
      return
    }

    // Check if product has price variations
    try {
      const res = await fetch(`/api/products/${product.id}/price-variations/active`)
      if (res.ok) {
        const data = await res.json()
        const variations = data.variations || []
        
        if (variations.length > 0) {
          // Show price variation modal
          setSelectedProductForVariation(product)
          setShowPriceVariationModal(true)
          return
        }
      }
    } catch (error) {
      console.error('Error checking price variations:', error)
    }

    // No price variations, proceed with normal flow
    addProductToCart(product, null)
  }

  const addProductToCart = (product, priceVariation = null) => {
    // Check if product is already in cart (with same variation if applicable)
    const variationKey = priceVariation ? `${product.id}-${priceVariation.id}` : product.id
    const existingItemIndex = cart.findIndex(item => {
      if (priceVariation) {
        return item.id === product.id && item.variationId === priceVariation.id
      }
      return item.id === product.id && !item.variationId
    })
    
    const qty = parseInt(quantity) || 1
    const productPrice = priceVariation ? priceVariation.price : getProductPrice(product)
    const discountPercent = parseFloat(discount) || 0
    const discountAmount = (productPrice * discountPercent) / 100
    const finalPrice = productPrice - discountAmount

    if (existingItemIndex >= 0) {
      // Product already in cart, increase quantity
      const existingItem = cart[existingItemIndex]
      const newQuantity = existingItem.quantity + qty
      
      if (newQuantity > product.available_quantity) {
        toast({
          title: "Insufficient stock",
          description: `Only ${product.available_quantity} units available. Current cart has ${existingItem.quantity}.`,
          variant: "destructive"
        })
        setQuantity(Math.max(1, product.available_quantity - existingItem.quantity).toString())
        return
      }

      // Update existing item quantity
      setCart(prev => prev.map((item, index) => 
        index === existingItemIndex 
          ? { 
              ...item, 
              quantity: newQuantity, 
              total: finalPrice * newQuantity,
              discount: discountPercent, // Update discount if changed
              unitPrice: finalPrice // Update unit price if discount changed
            }
          : item
      ))

      toast({
        title: "Quantity updated",
        description: `${product.name}${priceVariation ? ` (${priceVariation.variant_name})` : ''} quantity increased to ${newQuantity}${discountPercent > 0 ? ` (${discountPercent}% off)` : ''}`,
        duration: 1000
      })
    } else {
      // Product not in cart, add new item
      if (qty > product.available_quantity) {
        toast({
          title: "Insufficient stock",
          description: `Only ${product.available_quantity} units available`,
          variant: "destructive"
        })
        setQuantity(product.available_quantity.toString())
        return
      }

      const cartItem = {
        id: product.id,
        sku: product.sku,
        name: product.name,
        variationId: priceVariation?.id || null,
        variationName: priceVariation?.variant_name || null,
        originalPrice: productPrice,
        quantity: qty,
        discount: discountPercent,
        unitPrice: finalPrice,
        total: finalPrice * qty,
        availableStock: product.available_quantity
      }

      setCart(prev => [...prev, cartItem])

      toast({
        title: "Added to cart",
        description: `${product.name}${priceVariation ? ` (${priceVariation.variant_name})` : ''} × ${qty}${discountPercent > 0 ? ` (${discountPercent}% off)` : ''}`,
        duration: 1000
      })
    }

    setProductId('')
    setQuantity('1')
    // Don't clear discount automatically - let user keep it for multiple items

    // Auto-focus back to product input for next item
    setTimeout(() => {
      document.querySelector('input[placeholder="Scan or type product..."]')?.focus()
    }, 100)
  }

  const handleVariationSelect = (variation) => {
    if (selectedProductForVariation) {
      addProductToCart(selectedProductForVariation, variation)
      setSelectedProductForVariation(null)
    }
  }

  const removeFromCart = (index) => {
    const item = cart[index]
    setCart(prev => prev.filter((_, i) => i !== index))
    toast({
      title: "Item removed",
      description: `${item.name} removed from cart`
    })
  }

  const updateQuantity = (index, newQty) => {
    if (newQty <= 0) {
      removeFromCart(index)
      return
    }

    const item = cart[index]
    if (newQty > item.availableStock) {
      toast({
        title: "Insufficient stock",
        description: `Only ${item.availableStock} units available`,
        variant: "destructive"
      })
      return
    }
    
    setCart(prev => prev.map((item, i) => 
      i === index 
        ? { ...item, quantity: newQty, total: item.unitPrice * newQty }
        : item
    ))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const tax = subtotal * 0.08
  const total = subtotal + tax

  const printBill = async () => {
    // Get printer settings from localStorage
    const printerSettings = JSON.parse(localStorage.getItem('printerSettings') || '{}')
    const printMethod = printerSettings.printMethod || 'browser'
    
    const receiptContent = document.getElementById('thermal-receipt')
    
    if (!receiptContent) {
      toast({
        title: "Print Error",
        description: "Receipt content not found",
        variant: "destructive"
      })
      return
    }

    // Try direct printing methods first (network/webusb)
    if (printMethod === 'network' || printMethod === 'webusb') {
      try {
        const { printReceipt } = await import('@/lib/thermal-printer')
        
        // Prepare receipt data for ESC/POS
        const receiptData = {
          storeName: 'AgroPlus',
          address: '123 Farm Road, Green Valley',
          phone: '+94 77 123 4567',
          saleId: saleId || 'N/A',
          date: new Date().toLocaleString(),
          items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total
          })),
          subtotal,
          tax,
          total,
          customer: selectedCustomer,
          loyaltyInfo: selectedCustomer ? {
            pointsEarned,
            pointsRedeemed,
            newBalance: (selectedCustomer.points_balance || 0) + pointsEarned - pointsRedeemed
          } : null
        }

        const result = await printReceipt(receiptData, {
          preferredMethod: printMethod,
          printerIP: printerSettings.printerIP,
          printerPort: printerSettings.printerPort,
          fallbackToBrowser: true
        })

        if (result.success) {
          toast({
            title: "Print Success",
            description: `Receipt printed via ${result.method}`,
          })
          return
        }
      } catch (error) {
        console.error('Direct print failed, falling back to browser:', error)
        toast({
          title: "Direct Print Failed",
          description: "Falling back to browser print",
          variant: "destructive"
        })
      }
    }

    // Fallback: Browser print via hidden iframe
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)
    
    const iframeDoc = iframe.contentWindow.document
    
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Receipt - Sale #${saleId || 'N/A'}</title>
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
            body {
              margin: 0;
              padding: 0;
              font-family: monospace;
              width: 80mm;
            }
          </style>
        </head>
        <body>
          ${receiptContent.innerHTML}
        </body>
      </html>
    `)
    iframeDoc.close()
    
    // Wait for content to load, then print and remove iframe
    iframe.onload = () => {
      try {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
        
        // Remove iframe after a delay
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 1000)
      } catch (error) {
        console.error('Print error:', error)
        document.body.removeChild(iframe)
        toast({
          title: "Print Error",
          description: "Failed to print receipt",
          variant: "destructive"
        })
      }
    }
  }

  const clearCart = () => {
    setCart([])
    setShowBill(false)
    setSaleId(null)
    toast({
      title: "Cart cleared",
      description: "All items removed from cart"
    })
  }

  const handleNewSale = () => {
    setShowBill(false)
    clearCart()
  }

  const processSale = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty cart",
        description: "Please add items to cart before processing sale",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const saleData = {
        items: cart.map(item => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          original_price: item.originalPrice,
          discount_percentage: item.discount,
          discount_amount: (item.originalPrice - item.unitPrice) * item.quantity,
          total_amount: item.total,
          buying_price: item.buying_price || 0 // Include buying price for profit calculation
        })),
        subtotal,
        tax,
        total_amount: total,
        payment_method: 'cash', // Default to cash, can be updated based on UI
        cashier_id: session?.user?.id,
        cashier_name: session?.user?.name
      }

      // Try offline storage first
      const offlineResult = await offlineSalesModel.createSale(saleData);
      
      if (offlineResult.success) {
        // Update local product stock
        const stockUpdates = cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          operation: 'subtract'
        }));
        
        await offlineProductModel.bulkUpdateStock(stockUpdates);
        
        // Set sale ID from offline result
        const offlineSaleId = offlineResult.sale && offlineResult.sale._id ? offlineResult.sale._id : `OFF-${Date.now()}`
        setSaleId(offlineSaleId)
        setShowBill(true);
        toast({
          title: "Sale completed",
          description: "Transaction saved locally and will sync when online"
        });
        
        // Reload products to show updated stock
        loadProducts();
      } else {
        // Fallback to API if offline storage fails
        const response = await fetch('/api/sales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(saleData)
        });

        if (response.ok) {
          const result = await response.json();
          // Set sale ID from API response - use first sale ID or generate one
          const firstSaleId = result.sales && result.sales.length > 0 ? result.sales[0].id : null
          setSaleId(firstSaleId || `SALE-${Date.now()}`)
          setShowBill(true);
          toast({
            title: "Sale completed",
            description: "Transaction processed successfully"
          });
          loadProducts();
        } else {
          const error = await response.json();
          throw new Error(error.message || 'Failed to process sale');
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle return success - reload products
  const handleReturnSuccess = () => {
    loadProducts()
    toast({
      title: "Return Processed",
      description: "Inventory has been updated",
    })
  }

  // Keyboard shortcuts for faster operation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only apply shortcuts when not focused on input fields
      if (e.target.tagName === 'INPUT') return

      switch(e.key) {
        case 'F1':
          e.preventDefault()
          document.querySelector('input[placeholder="Scan or type product..."]')?.focus()
          break
        case 'F2':
          e.preventDefault()
          if (cart.length > 0) processSale()
          break
        case 'F3':
          e.preventDefault()
          clearCart()
          break
        case 'F4':
          e.preventDefault()
          document.querySelector('input[placeholder="Search products..."]')?.focus()
          break
        case '+':
          e.preventDefault()
          setQuantity((parseInt(quantity) + 1).toString())
          break
        case '-':
          e.preventDefault()
          setQuantity(Math.max(1, parseInt(quantity) - 1).toString())
          break
        case 'Enter':
          e.preventDefault()
          if (productId) addToCart()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [cart.length, productId, quantity, processSale, clearCart, addToCart])

  const isCashier = session?.user?.role === 'cashier'
  
  return (
    <div className={isCashier ? "fixed inset-0 bg-gray-50 dark:bg-black z-50 overflow-auto" : "min-h-screen bg-gray-50 dark:bg-black"}>
      {/* Compact Header */}
      <div className="bg-white dark:bg-black border-b dark:border-gray-800 shadow-sm">
        <div className="px-4 py-2 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            Point of Sale System
          </h1>
          
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <ConnectionStatusBadge />
            
            {/* Returns Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReturnModal(true)}
              className="flex items-center gap-2"
            >
              <Undo2 className="h-4 w-4" />
              Returns
            </Button>
            
            {/* Session Timer for Cashiers */}
            {isCashier && (
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div className="text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Session:</span>
                  <span className="ml-1 font-mono font-bold text-blue-800 dark:text-blue-200">
                    {formatSessionTime(sessionTime)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {session?.user?.name}
                </div>
              </div>
            )}
            {/* Keyboard Shortcuts Help */}
            <div className="text-xs text-gray-600 dark:text-gray-300 space-x-4 hidden md:flex">
              <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded">F1</kbd> Focus Product</span>
              <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded">F2</kbd> Complete Sale</span>
              <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded">F3</kbd> Clear Cart</span>
              <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded">F4</kbd> Search</span>
              <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded">Enter</kbd> Add Item</span>
            </div>
            
            {/* Logout button for cashier users */}
            {isCashier && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Top Input Row - Quick Access */}
        <div className="mb-4 bg-white dark:bg-black rounded-lg shadow-sm border dark:border-gray-800 p-4">
          {/* Global Discount Indicator */}
          {discount && parseFloat(discount) > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="font-semibold text-yellow-800 dark:text-yellow-200">
                    Global Discount Active: {discount}% OFF
                  </span>
                </div>
                <button
                  onClick={() => setDiscount('')}
                  className="text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100 font-bold"
                >
                  Clear ×
                </button>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                All items added to cart will have this discount applied automatically.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-12 gap-4 items-end">
            {/* Product Search/Input - 4 columns */}
            <div className="col-span-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Product ID/SKU/Name
              </label>
              <input
                type="text"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addToCart()}
                className="w-full h-12 px-4 text-lg font-mono border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-black dark:border-gray-600 dark:text-gray-100"
                placeholder="Scan or type product..."
                autoFocus
              />
            </div>

            {/* Quantity - 2 columns */}
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Quantity
              </label>
              <div className="flex">
                <button
                  onClick={() => setQuantity(Math.max(1, parseInt(quantity) - 1).toString())}
                  className="h-12 w-12 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-l-lg border border-r-0 flex items-center justify-center"
                >
                  <span className="text-lg font-bold">−</span>
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="h-12 w-20 text-center text-lg font-bold border-t border-b focus:ring-2 focus:ring-blue-500 dark:bg-black dark:border-gray-600 dark:text-gray-100"
                  min="1"
                />
                <button
                  onClick={() => setQuantity((parseInt(quantity) + 1).toString())}
                  className="h-12 w-12 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-r-lg border border-l-0 flex items-center justify-center"
                >
                  <span className="text-lg font-bold">+</span>
                </button>
              </div>
            </div>

            {/* Discount - 2 columns */}
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Discount % {discount && parseFloat(discount) > 0 && (
                  <span className="text-green-600 dark:text-green-400 font-bold">
                    (Active)
                  </span>
                )}
              </label>
              <div className="flex">
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className={`flex-1 h-12 px-4 text-lg border rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-black dark:border-gray-600 dark:text-gray-100 ${
                    discount && parseFloat(discount) > 0 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                      : ''
                  }`}
                  placeholder="0"
                  min="0"
                  max="100"
                />
                {discount && (
                  <button
                    onClick={() => setDiscount('')}
                    className="h-12 px-3 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-r-lg border border-l-0 text-gray-600 dark:text-gray-300 text-sm"
                    title="Clear discount"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Add Button - 2 columns */}
            <div className="col-span-2">
              <button
                onClick={addToCart}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-lg transition-colors duration-150 focus:ring-2 focus:ring-green-500"
              >
                ADD TO CART
              </button>
            </div>

            {/* Quick Clear - 2 columns */}
            <div className="col-span-2">
              <button
                onClick={clearCart}
                disabled={cart.length === 0}
                className="w-full h-12 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold text-lg rounded-lg transition-colors duration-150"
              >
                CLEAR CART
              </button>
            </div>
          </div>

          {/* Product Preview */}
          {productId && findProduct(productId) && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-semibold text-blue-900 dark:text-blue-100">
                    {findProduct(productId).name}
                  </span>
                  <span className="ml-2 text-sm text-blue-700 dark:text-blue-300">
                    (Stock: {findProduct(productId).available_quantity})
                  </span>
                </div>
                <div className="text-right">
                  {discount && parseFloat(discount) > 0 ? (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-300 line-through">
                        LKR {getProductPrice(findProduct(productId)).toFixed(2)}
                      </span>
                      <span className="ml-2 font-bold text-lg text-green-600 dark:text-green-400">
                        LKR {(getProductPrice(findProduct(productId)) * (1 - parseFloat(discount) / 100)).toFixed(2)}
                      </span>
                      <div className="text-xs text-green-600 dark:text-green-400">
                        {discount}% OFF
                      </div>
                    </div>
                  ) : (
                    <span className="font-bold text-lg text-blue-900 dark:text-blue-100">
                      LKR {getProductPrice(findProduct(productId)).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-12 gap-4">
          {/* Product Grid - 8 columns */}
          <div className="col-span-8">
            <div className="bg-white dark:bg-black rounded-lg shadow-sm border dark:border-gray-800 p-4 h-fit">
              <div className="mb-4 space-y-3">
                {/* Search and Sort Controls */}
                <div className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="flex-1 h-10 px-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-black dark:border-gray-600 dark:text-gray-100"
                    placeholder="Search products..."
                  />
                  
                  {/* Sort By Dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-10 px-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-black dark:border-gray-600 dark:text-gray-100 text-sm"
                  >
                    <option value="popularity">Popularity</option>
                    <option value="name">Name</option>
                    <option value="price">Price</option>
                    <option value="stock">Stock</option>
                    <option value="sku">SKU</option>
                  </select>
                  
                  {/* Sort Order Toggle */}
                  <button
                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                    className="h-10 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    title={`Sort ${sortOrder === 'desc' ? 'Ascending' : 'Descending'}`}
                  >
                    {sortOrder === 'desc' ? (
                      <>
                        <span className="text-lg">↓</span>
                        DESC
                      </>
                    ) : (
                      <>
                        <span className="text-lg">↑</span>
                        ASC
                      </>
                    )}
                  </button>
                </div>
                
                {/* Sort Info */}
                <div className="text-xs text-gray-600 dark:text-gray-300 flex justify-between items-center">
                  <span>
                    Showing {filteredProducts.length} products sorted by{' '}
                    <span className="font-medium">
                      {sortBy === 'popularity' ? 'Popularity' : 
                       sortBy === 'name' ? 'Name' :
                       sortBy === 'price' ? 'Price' :
                       sortBy === 'stock' ? 'Stock' : 'SKU'}
                    </span>
                    {' '}({sortOrder === 'desc' ? 'High to Low' : 'Low to High'})
                  </span>
                  
                  {/* Quick Sort Buttons */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => {setSortBy('popularity'); setSortOrder('desc')}}
                      className={`px-2 py-1 text-xs rounded ${sortBy === 'popularity' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                      🔥 Hot
                    </button>
                    <button
                      onClick={() => {setSortBy('price'); setSortOrder('asc')}}
                      className={`px-2 py-1 text-xs rounded ${sortBy === 'price' && sortOrder === 'asc' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                      💰 Cheap
                    </button>
                    <button
                      onClick={() => {setSortBy('name'); setSortOrder('asc')}}
                      className={`px-2 py-1 text-xs rounded ${sortBy === 'name' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                      🔤 A-Z
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-3">
                {filteredProducts.map((product, index) => {
                  const isTopSeller = sortBy === 'popularity' && index < 3 && product.sold_quantity > 10;
                  const isPopular = sortBy === 'popularity' && product.sold_quantity > 5;
                  const isLowStock = product.available_quantity <= 5;
                  const isExpensive = sortBy === 'price' && getProductPrice(product) > 50;
                  
                  return (
                  <button
                    key={product.id}
                    onClick={() => {
                      // Check if product is already in cart
                      const existingItemIndex = cart.findIndex(item => item.id === product.id)
                      const qty = parseInt(quantity) || 1
                      const productPrice = getProductPrice(product)
                      const discountPercent = parseFloat(discount) || 0
                      const discountAmount = (productPrice * discountPercent) / 100
                      const finalPrice = productPrice - discountAmount

                      if (product.available_quantity <= 0) {
                        toast({
                          title: "Out of stock",
                          description: `${product.name} is currently out of stock`,
                          variant: "destructive"
                        })
                        return
                      }

                      if (existingItemIndex >= 0) {
                        // Product already in cart, increase quantity
                        const existingItem = cart[existingItemIndex]
                        const newQuantity = existingItem.quantity + qty
                        
                        if (newQuantity > product.available_quantity) {
                          toast({
                            title: "Insufficient stock",
                            description: `Only ${product.available_quantity} units available. Current cart has ${existingItem.quantity}.`,
                            variant: "destructive"
                          })
                          return
                        }

                        // Update existing item quantity
                        setCart(prev => prev.map((item, index) => 
                          index === existingItemIndex 
                            ? { 
                                ...item, 
                                quantity: newQuantity, 
                                total: finalPrice * newQuantity,
                                discount: discountPercent, // Update discount if changed
                                unitPrice: finalPrice // Update unit price if discount changed
                              }
                            : item
                        ))

                        toast({
                          title: "Quantity updated",
                          description: `${product.name} quantity increased to ${newQuantity}${discountPercent > 0 ? ` (${discountPercent}% off)` : ''}`,
                          duration: 1000
                        })
                      } else {
                        // Product not in cart, add new item
                        if (qty > product.available_quantity) {
                          toast({
                            title: "Insufficient stock",
                            description: `Only ${product.available_quantity} units available`,
                            variant: "destructive"
                          })
                          return
                        }

                        const cartItem = {
                          id: product.id,
                          sku: product.sku,
                          name: product.name,
                          originalPrice: productPrice,
                          quantity: qty,
                          discount: discountPercent,
                          unitPrice: finalPrice,
                          total: finalPrice * qty,
                          availableStock: product.available_quantity
                        }

                        setCart(prev => [...prev, cartItem])

                        toast({
                          title: "Added to cart",
                          description: `${product.name} × ${qty}${discountPercent > 0 ? ` (${discountPercent}% off)` : ''}`,
                          duration: 1000
                        })
                      }

                      setQuantity('1')
                      // Don't clear discount automatically - let user keep it for multiple items
                    }}
                    className={`p-3 hover:shadow-md rounded-lg border text-left transition-all duration-150 transform hover:scale-105 relative ${
                      isTopSeller 
                        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-orange-300 dark:border-orange-700 shadow-md'
                        : isPopular && sortBy === 'popularity'
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                        : isLowStock && sortBy === 'stock'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                        : isExpensive && sortBy === 'price'
                        ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700'
                        : 'bg-gray-50 dark:bg-black border-gray-200 dark:border-gray-600'
                    } hover:bg-blue-50 dark:hover:bg-blue-900/20`}
                  >
                    {/* Dynamic Badge based on sort type */}
                    {sortBy === 'popularity' && isTopSeller && (
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                        🔥 HOT
                      </div>
                    )}
                    
                    {sortBy === 'popularity' && product.sold_quantity > 0 && !isTopSeller && (
                      <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                        {product.sold_quantity}
                      </div>
                    )}
                    
                    {sortBy === 'stock' && isLowStock && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                        LOW
                      </div>
                    )}
                    
                    {sortBy === 'price' && isExpensive && (
                      <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                        💎
                      </div>
                    )}
                    
                    {sortBy === 'name' && index < 3 && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                        #{index + 1}
                      </div>
                    )}
                    
                    <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1 truncate" title={product.name}>
                      {product.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 mb-1 font-mono">
                      {product.sku}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-left">
                        {discount && parseFloat(discount) > 0 ? (
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-300 line-through">
                              LKR {getProductPrice(product).toFixed(2)}
                            </span>
                            <div className="font-bold text-green-600 dark:text-green-400">
                              LKR {(getProductPrice(product) * (1 - parseFloat(discount) / 100)).toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          <span className="font-bold text-green-600 dark:text-green-400">
                            LKR {getProductPrice(product).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        {discount && parseFloat(discount) > 0 && (
                          <div className="text-xs bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 px-1 py-0.5 rounded mb-1">
                            {discount}% OFF
                          </div>
                        )}
                        <span className={`text-xs px-2 py-1 rounded ${
                          product.available_quantity > 10 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : product.available_quantity > 0
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {product.available_quantity}
                        </span>
                      </div>
                    </div>
                  </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Cart & Checkout - 4 columns */}
          <div className="col-span-4">
            <div className="bg-white dark:bg-black rounded-lg shadow-sm border dark:border-gray-800 p-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart ({cart.length} items)
              </h3>

              {/* Cart Items */}
              <div className="max-h-64 overflow-y-auto mb-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-300">
                    Cart is empty
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cart.map((item, index) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-black rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate" title={item.name}>
                              {item.name}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-300 font-mono">
                              {item.sku} • LKR {item.unitPrice.toFixed(2)} each
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCart(index)}
                            className="ml-2 w-6 h-6 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                          >
                            ×
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQuantity(index, item.quantity - 1)}
                              className="w-7 h-7 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded text-sm font-bold transition-colors"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                              className="w-12 h-7 text-center text-sm font-mono bg-white dark:bg-black border border-gray-300 dark:border-gray-600 rounded"
                              min="1"
                              max={item.availableStock}
                            />
                            <button
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                              className="w-7 h-7 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded text-sm font-bold transition-colors"
                            >
                              +
                            </button>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600 dark:text-green-400">
                              LKR {item.total.toFixed(2)}
                            </div>
                            {item.discount > 0 && (
                              <div className="text-xs text-gray-500 dark:text-gray-300">
                                {item.discount}% off
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totals */}
              {cart.length > 0 && (
                <div className="border-t dark:border-gray-600 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">Subtotal:</span>
                      <span className="font-bold">LKR {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">Tax (8%):</span>
                      <span className="font-bold">LKR {tax.toFixed(2)}</span>
                    </div>
                    <div className="border-t dark:border-gray-600 pt-2">
                      <div className="flex justify-between text-2xl font-bold text-green-600 dark:text-green-400">
                        <span>TOTAL:</span>
                        <span>LKR {total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={processSale}
                    disabled={isLoading}
                    className="w-full mt-4 h-16 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold text-xl rounded-lg transition-all duration-150 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:shadow-none flex items-center justify-center gap-3"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        PROCESSING...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-6 w-6" />
                        COMPLETE SALE (F2)
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      <Receipt
        isOpen={showBill}
        onClose={setShowBill}
        cart={cart}
        saleId={saleId}
        onPrint={printBill}
        onNewSale={handleNewSale}
      />

      {/* Hidden Thermal Receipt for Printing */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <ThermalReceipt cart={cart} saleId={saleId} />
      </div>

      {/* Price Variation Modal */}
      <PriceVariationModal
        isOpen={showPriceVariationModal}
        onClose={() => {
          setShowPriceVariationModal(false)
          setSelectedProductForVariation(null)
        }}
        product={selectedProductForVariation}
        onVariationSelect={handleVariationSelect}
      />

      {/* Returns Modal */}
      <POSReturnModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        onSuccess={handleReturnSuccess}
      />
    </div>
  )
}
