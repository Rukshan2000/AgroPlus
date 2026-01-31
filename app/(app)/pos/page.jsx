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
import PaymentModal from '@/components/pos/payment-modal'
import PrintProductsButton from '@/components/pos/print-products-button'
import CashDrawerButton from '@/components/pos/cash-drawer-button'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/theme-toggle'
import ScreenSizeChanger from '@/components/pos/screen-size-changer'

export default function POSSystem() {
  const [cart, setCart] = useState([])
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [discount, setDiscount] = useState('') // Per-item discount
  const [billDiscount, setBillDiscount] = useState('') // Whole bill discount
  const [showBill, setShowBill] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentDetails, setPaymentDetails] = useState(null)
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
  const [selectedProductIndex, setSelectedProductIndex] = useState(0) // For arrow key navigation
  const [selectedOutlet, setSelectedOutlet] = useState(null) // Store selected outlet
  const [selectedCartIndex, setSelectedCartIndex] = useState(null) // For cart item quantity editing
  const [cartInputQty, setCartInputQty] = useState('') // Temporary quantity input for selected cart item
  const { toast } = useToast()
  const { session } = useSession()
  const isCashier = session?.user?.role === 'cashier'

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
    // Get selected outlet from localStorage
    const outletId = localStorage.getItem('selectedOutlet')
    if (outletId) {
      setSelectedOutlet(parseInt(outletId))
    }
    loadProducts(outletId)
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

  // Focus quantity input when editing cart item
  useEffect(() => {
    if (selectedCartIndex !== null) {
      setTimeout(() => {
        const input = document.querySelector('.quantity-input')
        if (input) input.focus()
      }, 10)
    }
  }, [selectedCartIndex])

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

  const loadProducts = async (outletId) => {
    try {
      let url
      
      // If outlet is selected, load distributed products for that outlet
      if (outletId) {
        url = `/api/products/distributed?outlet_id=${outletId}&limit=100&is_active=true`
      } else {
        // Fallback to all active products if no outlet
        url = '/api/products?limit=100&is_active=true'
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      } else {
        throw new Error('Failed to fetch products')
      }
    } catch (error) {
      console.error('Error loading products:', error)
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      })
      // Fallback to all products on error
      try {
        const response = await fetch('/api/products?limit=100&is_active=true')
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
        }
      } catch (fallbackError) {
        console.error('Fallback product load failed:', fallbackError)
      }
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
        document.querySelector('input[placeholder="SCAN/TYPE PRODUCT..."]')?.focus()
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
      setProductSearch('')
      setTimeout(() => {
        document.querySelector('input[placeholder="SCAN/TYPE PRODUCT..."]')?.focus()
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
    
    const qty = parseFloat(quantity) || 1
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
    setProductSearch('')
    setQuantity('1')
    // Don't clear discount automatically - let user keep it for multiple items

    // Auto-focus back to product input for next item
    setTimeout(() => {
      document.querySelector('input[placeholder="SCAN/TYPE PRODUCT..."]')?.focus()
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
    
    toast({
      title: "Quantity updated",
      description: `${item.name} × ${newQty}`,
      duration: 800
    })
  }

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const billDiscountPercent = parseFloat(billDiscount) || 0
  const billDiscountAmount = (subtotal * billDiscountPercent) / 100
  const total = subtotal - billDiscountAmount

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
          storeName: 'Green Plus Agro',
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
    setBillDiscount('')
    toast({
      title: "Cart cleared",
      description: "All items removed from cart"
    })
  }

  const handleNewSale = () => {
    setShowBill(false)
    setPaymentDetails(null)
    clearCart()
  }

  const initiatePayment = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty cart",
        description: "Please add items to cart before processing sale",
        variant: "destructive"
      })
      return
    }

    // Show payment modal instead of processing immediately
    setShowPaymentModal(true)
  }

  const handlePaymentComplete = (payment) => {
    setPaymentDetails(payment)
    setShowPaymentModal(false)
    // Now process the sale with payment details
    processSale(payment)
  }

  const processSale = async (payment) => {
    setIsLoading(true)
    try {
      const outletId = localStorage.getItem('selectedOutlet')
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
        bill_discount_percentage: billDiscountPercent,
        bill_discount_amount: billDiscountAmount,
        total,
        payment_method: payment.method,
        amount_paid: payment.amount_paid,
        change_given: payment.change,
        cashier_id: session?.user?.id,
        cashier_name: session?.user?.name,
        outlet_id: outletId ? parseInt(outletId) : null
      }

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
        loadProducts(outletId);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process sale');
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
    const outletId = localStorage.getItem('selectedOutlet')
    loadProducts(outletId)
    toast({
      title: "Return Processed",
      description: "Inventory has been updated",
    })
  }

  // Keyboard shortcuts for faster operation (Ctrl-based to avoid Chrome conflicts)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only apply Ctrl shortcuts when not focused on input fields (except Ctrl+Enter for add)
      const isInputFocused = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA'
      
      // Ctrl+Q - Focus Product Input
      if (e.ctrlKey && e.key === 'q') {
        e.preventDefault()
        document.querySelector('input[placeholder="Scan or type product..."]')?.focus()
        return
      }
      
      // Ctrl+Enter - Complete Sale
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault()
        if (cart.length > 0) initiatePayment()
        return
      }
      
      // Ctrl+K - Clear Cart
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault()
        clearCart()
        return
      }
      
      // Ctrl+/ - Focus Search
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault()
        document.querySelector('input[placeholder="Search products..."]')?.focus()
        return
      }
      
      // Ctrl+L - Logout (for cashiers)
      if (e.ctrlKey && e.key === 'l' && isCashier) {
        e.preventDefault()
        handleLogout()
        return
      }

      // Ctrl++ - Zoom In
      if (e.ctrlKey && (e.key === '+' || e.key === '=')) {
        e.preventDefault()
        const currentZoom = parseInt(localStorage.getItem('pos-zoom') || '100')
        const newZoom = Math.min(currentZoom + 10, 200)
        document.documentElement.style.fontSize = `${(newZoom / 100) * 16}px`
        document.body.style.transform = `scale(${newZoom / 100})`
        document.body.style.transformOrigin = 'top left'
        document.body.style.width = `${100 / (newZoom / 100)}%`
        localStorage.setItem('pos-zoom', newZoom)
        return
      }

      // Ctrl+- - Zoom Out
      if (e.ctrlKey && e.key === '-') {
        e.preventDefault()
        const currentZoom = parseInt(localStorage.getItem('pos-zoom') || '100')
        const newZoom = Math.max(currentZoom - 10, 80)
        document.documentElement.style.fontSize = `${(newZoom / 100) * 16}px`
        document.body.style.transform = `scale(${newZoom / 100})`
        document.body.style.transformOrigin = 'top left'
        document.body.style.width = `${100 / (newZoom / 100)}%`
        localStorage.setItem('pos-zoom', newZoom)
        return
      }

      // Ctrl+0 - Reset Zoom
      if (e.ctrlKey && e.key === '0') {
        e.preventDefault()
        document.documentElement.style.fontSize = '16px'
        document.body.style.transform = 'scale(1)'
        document.body.style.transformOrigin = 'top left'
        document.body.style.width = '100%'
        localStorage.setItem('pos-zoom', '100')
        return
      }
      
      // Regular shortcuts (only when not in input)
      if (isInputFocused) {
        // Allow Enter in product input to add to cart
        if (e.key === 'Enter' && productId) {
          e.preventDefault()
          addToCart()
        }
        return
      }

      // Arrow key navigation for product grid
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        const totalProducts = filteredProducts.length
        if (totalProducts === 0) return
        
        const cols = 4 // Grid has 4 columns
        let newIndex = selectedProductIndex
        
        switch(e.key) {
          case 'ArrowRight':
            newIndex = Math.min(selectedProductIndex + 1, totalProducts - 1)
            break
          case 'ArrowLeft':
            newIndex = Math.max(selectedProductIndex - 1, 0)
            break
          case 'ArrowDown':
            newIndex = Math.min(selectedProductIndex + cols, totalProducts - 1)
            break
          case 'ArrowUp':
            newIndex = Math.max(selectedProductIndex - cols, 0)
            break
        }
        
        setSelectedProductIndex(newIndex)
        
        // Scroll the selected product into view
        const productButtons = document.querySelectorAll('[data-product-index]')
        if (productButtons[newIndex]) {
          productButtons[newIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
        return
      }
      
      // Space or Enter to add selected product to cart
      if ((e.key === ' ' || e.key === 'Enter') && filteredProducts.length > 0) {
        e.preventDefault()
        const selectedProduct = filteredProducts[selectedProductIndex]
        if (selectedProduct) {
          // Trigger click on the product button
          const productButtons = document.querySelectorAll('[data-product-index]')
          if (productButtons[selectedProductIndex]) {
            productButtons[selectedProductIndex].click()
          }
        }
        return
      }

      switch(e.key) {
        case '+':
          e.preventDefault()
          setQuantity((parseInt(quantity) + 1).toString())
          break
        case '-':
          e.preventDefault()
          setQuantity(Math.max(1, parseInt(quantity) - 1).toString())
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [cart.length, productId, quantity, filteredProducts, selectedProductIndex, isCashier, initiatePayment, clearCart, addToCart, handleLogout])
  
  return (
    <div className={isCashier ? "fixed inset-0 bg-black z-50 overflow-hidden flex flex-col" : "min-h-screen bg-black flex flex-col"}>
      {/* Header - Compact Terminal Style */}
      <div className="bg-gray-950 border-b-2 border-gray-700">
        <div className="px-3 py-2 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-green-500" />
              POS SYSTEM
            </h1>
            {selectedOutlet && (
              <span className="text-xs font-bold bg-green-600 text-white px-3 py-1 rounded border-2 border-green-400">
                {localStorage.getItem('selectedOutletName') || `Outlet #${selectedOutlet}`}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            {isCashier && (
              <div className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded border border-gray-600">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-300">Session: <span className="font-mono font-bold text-green-400">{formatSessionTime(sessionTime)}</span></span>
              </div>
            )}
            <PrintProductsButton products={products} />
            <CashDrawerButton />
            {isCashier && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="h-7 px-2 text-xs"
              >
                <LogOut className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area - Terminal Style */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Products & Cart */}
        <div className="flex-1 flex flex-col overflow-hidden border-r-2 border-gray-700">
          {/* Product Input Section */}
          <div className="bg-gray-900 border-b-2 border-gray-700 p-3">
            <input
              type="text"
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value)
                setProductSearch(e.target.value)
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  if (selectedCartIndex !== null) {
                    // Apply quantity if cart item is selected
                    const newQty = parseFloat(cartInputQty) || 1
                    if (newQty > 0) {
                      updateQuantity(selectedCartIndex, newQty)
                      setSelectedCartIndex(null)
                      setCartInputQty('')
                    }
                  } else if (cart.length > 0 && !productId) {
                    // If cart has items and product field is empty, complete sale
                    initiatePayment()
                  } else if (productId) {
                    // Add product
                    addToCart()
                  }
                }
              }}
              className="w-full h-14 px-4 text-lg font-mono bg-gray-800 text-white border-2 border-gray-600 focus:border-green-500 focus:outline-none rounded-none"
              placeholder="SCAN/TYPE PRODUCT..."
              autoFocus
            />
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto bg-black p-2">
            <div className="grid grid-cols-3 gap-1">
              {filteredProducts.slice(0, 12).map((product, index) => (
                <button
                  key={product.id}
                  data-product-index={index}
                  onClick={() => {
                    setSelectedProductIndex(index)
                    addProductToCart(product, null, true)
                  }}
                  className={`p-3 border-2 text-left transition-all rounded-none font-bold text-xs ${
                    product.available_quantity > 0
                      ? 'bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-gray-500 text-white'
                      : 'bg-gray-900 border-gray-700 text-gray-500 opacity-50'
                  }`}
                >
                  <div className="font-bold text-white truncate">{product.name}</div>
                  <div className="text-gray-400 text-xs mb-1">{product.sku}</div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-400 font-bold">LKR {getProductPrice(product).toFixed(2)}</span>
                    <span className={`text-xs px-2 py-1 rounded-none font-bold ${
                      product.available_quantity > 10 
                        ? 'bg-green-700 text-white'
                        : product.available_quantity > 0
                        ? 'bg-yellow-700 text-white'
                        : 'bg-red-700 text-white'
                    }`}>
                      {product.available_quantity}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Discount Section */}
          <div className="bg-gray-900 border-t-2 border-gray-700 p-3 border-b-2 space-y-3">
            <div className="text-white font-bold text-lg">DISCOUNTS</div>
            <div className="space-y-3">
              {/* Per-Item Discount */}
              <div className="flex gap-2 items-center">
                <label className="text-sm text-gray-300 w-20 font-bold">Item %:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="flex-1 h-10 px-3 text-base font-bold bg-gray-800 text-white border-2 border-gray-600 focus:border-yellow-500"
                  placeholder="0"
                />
                {discount && parseFloat(discount) > 0 && (
                  <button
                    onClick={() => setDiscount('')}
                    className="w-10 h-10 bg-red-700 hover:bg-red-800 text-white rounded-none text-lg font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
              {/* Bill Discount */}
              <div className="flex gap-2 items-center">
                <label className="text-sm text-gray-300 w-20 font-bold">Bill %:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={billDiscount}
                  onChange={(e) => setBillDiscount(e.target.value)}
                  className="flex-1 h-10 px-3 text-base font-bold bg-gray-800 text-white border-2 border-gray-600 focus:border-orange-500"
                  placeholder="0"
                />
                {billDiscount && parseFloat(billDiscount) > 0 && (
                  <button
                    onClick={() => setBillDiscount('')}
                    className="w-10 h-10 bg-red-700 hover:bg-red-800 text-white rounded-none text-lg font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
              {/* Quick Discount Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setDiscount(pct.toString())}
                    className="h-10 bg-yellow-700 hover:bg-yellow-800 text-white text-sm font-bold border-2 border-yellow-900 rounded-none"
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-900 border-t-2 border-gray-700 p-2 grid grid-cols-3 gap-1">
            <button
              onClick={() => setShowReturnModal(true)}
              className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-2 rounded-none border-2 border-red-900 text-sm"
            >
              RETURNS
            </button>
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white font-bold py-2 px-2 rounded-none border-2 border-gray-800 text-sm"
            >
              CLEAR CART
            </button>
            <button
              onClick={() => {
                document.querySelector('input[placeholder="SCAN/TYPE PRODUCT..."]')?.focus()
              }}
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-2 rounded-none border-2 border-blue-900 text-sm"
            >
              NEW ITEM
            </button>
          </div>
        </div>

        {/* Right Side - Cart & Keypad - Half Screen Width */}
        <div className="w-7/16 flex flex-col bg-gray-900 border-r-2 border-gray-700">
          {/* Cart Display - Enhanced Size */}
          <div className="flex-1 overflow-y-auto bg-black p-2 border-b-2 border-gray-700">
            <div className="text-white font-bold text-base mb-3">CART ({cart.length})</div>
            <div className="space-y-2">
              {cart.map((item, index) => (
                <div 
                  key={index} 
                  onClick={() => {
                    setSelectedCartIndex(index)
                    setCartInputQty(item.quantity.toString())
                  }}
                  className={`border-2 p-3 rounded-none cursor-pointer transition-all ${
                    selectedCartIndex === index
                      ? 'bg-blue-900 border-blue-500 ring-2 ring-blue-400'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-sm truncate" title={item.name}>{item.name}</div>
                      <div className="text-gray-400 text-sm font-mono">{item.sku}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFromCart(index)
                        if (selectedCartIndex === index) {
                          setSelectedCartIndex(null)
                          setCartInputQty('')
                        }
                      }}
                      className="w-7 h-7 bg-red-700 hover:bg-red-800 text-white rounded-none flex items-center justify-center text-lg font-bold ml-2 flex-shrink-0"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex justify-between items-center mb-2 text-sm font-bold">
                    <span className="text-gray-300">{selectedCartIndex === index ? 'NEW QTY:' : `Qty: ${item.quantity}`}</span>
                    <span className="text-green-400 text-base">LKR {item.total.toFixed(2)}</span>
                  </div>
                  {selectedCartIndex === index && (
                    <div className="pt-2 border-t border-blue-700 text-center space-y-1">
                      <input
                        type="number"
                        step="0.01"
                        value={cartInputQty}
                        onChange={(e) => setCartInputQty(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const newQty = parseFloat(cartInputQty) || 1
                            if (newQty > 0) {
                              updateQuantity(selectedCartIndex, newQty)
                              setSelectedCartIndex(null)
                              setCartInputQty('')
                            }
                          }
                        }}
                        className="quantity-input w-full text-center text-white font-bold text-lg bg-blue-950 p-2 border-2 border-blue-600 focus:border-blue-400 rounded-none"
                        autoFocus
                      />
                      <div className="text-xs text-blue-300 font-bold">Type quantity and press Enter, or use keypad</div>
                    </div>
                  )}
                </div>
              ))}
              {cart.length === 0 && (
                <div className="text-center text-gray-500 py-8 text-sm">No items in cart</div>
              )}
            </div>
          </div>

          {/* Totals & Checkout - Enhanced Size */}
          <div className="bg-black border-b-2 border-gray-700 p-3 space-y-2">
            <div className="flex justify-between text-white font-bold text-base">
              <span>SUBTOTAL:</span>
              <span>LKR {subtotal.toFixed(2)}</span>
            </div>
            {discount && parseFloat(discount) > 0 && (
              <div className="flex justify-between text-yellow-400 font-bold text-sm">
                <span>Item Discount ({discount}%):</span>
                <span>-LKR {((subtotal * parseFloat(discount)) / 100).toFixed(2)}</span>
              </div>
            )}
            {billDiscountAmount > 0 && (
              <div className="flex justify-between text-orange-400 font-bold text-base">
                <span>Bill Discount ({billDiscount}%):</span>
                <span>-LKR {billDiscountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-gray-700 pt-2 flex justify-between text-green-400 font-bold text-2xl">
              <span>TOTAL:</span>
              <span>LKR {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Numeric Keypad - Smart Context */}
          <div className="bg-gray-900 p-1 grid grid-cols-4 gap-1">
            {['7', '8', '9', 'CLR'].map((btn) => (
              <button
                key={btn}
                onClick={() => {
                  if (selectedCartIndex !== null) {
                    // Cart mode - enter quantity
                    if (btn === 'CLR') {
                      setCartInputQty('')
                    } else {
                      setCartInputQty(prev => prev + btn)
                    }
                  } else {
                    // Product search mode
                    if (btn === 'CLR') {
                      setProductId('')
                      setProductSearch('')
                    } else {
                      setProductId(prev => prev + btn)
                      setProductSearch(prev => prev + btn)
                    }
                  }
                }}
                className={`${
                  btn === 'CLR' 
                    ? 'bg-red-700 hover:bg-red-800 border-red-900' 
                    : 'bg-gray-800 hover:bg-gray-700 border-gray-700'
                } text-white font-bold py-3 px-2 rounded-none border-2 text-lg`}
                title={selectedCartIndex !== null ? 'Clear quantity' : 'Clear product'}
              >
                {btn}
              </button>
            ))}
            {['4', '5', '6', 'DEL'].map((btn) => (
              <button
                key={btn}
                onClick={() => {
                  if (selectedCartIndex !== null) {
                    // Cart mode
                    if (btn === 'DEL') {
                      setCartInputQty(prev => prev.slice(0, -1))
                    } else {
                      setCartInputQty(prev => prev + btn)
                    }
                  } else {
                    // Product search mode
                    if (btn === 'DEL') {
                      setProductId(prev => prev.slice(0, -1))
                      setProductSearch(prev => prev.slice(0, -1))
                    } else {
                      setProductId(prev => prev + btn)
                      setProductSearch(prev => prev + btn)
                    }
                  }
                }}
                className={`${
                  btn === 'DEL' 
                    ? 'bg-yellow-700 hover:bg-yellow-800 border-yellow-900' 
                    : 'bg-gray-800 hover:bg-gray-700 border-gray-700'
                } text-white font-bold py-3 px-2 rounded-none border-2 text-lg`}
                title={selectedCartIndex !== null ? 'Delete last digit' : 'Delete last char'}
              >
                {btn}
              </button>
            ))}
            {['1', '2', '3', 'ADD'].map((btn) => (
              <button
                key={btn}
                onClick={() => {
                  if (btn === 'ADD') {
                    if (selectedCartIndex !== null) {
                      // Apply quantity change to cart item
                      const newQty = parseFloat(cartInputQty) || 1
                      if (newQty > 0) {
                        updateQuantity(selectedCartIndex, newQty)
                        setSelectedCartIndex(null)
                        setCartInputQty('')
                      }
                    } else {
                      // Add new product to cart
                      addToCart()
                    }
                  } else {
                    if (selectedCartIndex !== null) {
                      setCartInputQty(prev => prev + btn)
                    } else {
                      setProductId(prev => prev + btn)
                      setProductSearch(prev => prev + btn)
                    }
                  }
                }}
                className={`${
                  btn === 'ADD' 
                    ? 'bg-green-700 hover:bg-green-800 border-green-900' 
                    : 'bg-gray-800 hover:bg-gray-700 border-gray-700'
                } text-white font-bold py-3 px-2 rounded-none border-2 text-lg`}
                title={selectedCartIndex !== null ? (btn === 'ADD' ? 'Apply quantity' : 'Enter digit') : (btn === 'ADD' ? 'Add to cart' : 'Enter digit')}
              >
                {btn}
              </button>
            ))}
            {['0', '00', 'ENT', 'ENT'].map((btn, btnIndex) => (
              <button
                key={btn + btnIndex}
                onClick={() => {
                  if (btn === 'ENT') {
                    if (selectedCartIndex !== null) {
                      // Apply quantity change and close selection
                      const newQty = parseFloat(cartInputQty) || 1
                      if (newQty > 0) {
                        updateQuantity(selectedCartIndex, newQty)
                        setSelectedCartIndex(null)
                        setCartInputQty('')
                      }
                    } else if (cart.length > 0) {
                      // Complete the sale
                      initiatePayment()
                    }
                  } else if (btn === '00') {
                    if (selectedCartIndex !== null) {
                      setCartInputQty(prev => prev + '00')
                    } else {
                      setProductId(prev => prev + '00')
                      setProductSearch(prev => prev + '00')
                    }
                  } else {
                    if (selectedCartIndex !== null) {
                      setCartInputQty(prev => prev + btn)
                    } else {
                      setProductId(prev => prev + btn)
                      setProductSearch(prev => prev + btn)
                    }
                  }
                }}
                className={`${
                  btn === 'ENT' 
                    ? 'bg-green-600 hover:bg-green-700 border-green-800' 
                    : 'bg-gray-800 hover:bg-gray-700 border-gray-700'
                } text-white font-bold py-3 px-2 rounded-none border-2 text-lg`}
                title={btn === 'ENT' ? (selectedCartIndex !== null ? 'Apply quantity' : 'Complete sale') : 'Enter digit'}
              >
                {btn}
              </button>
            ))}
          </div>

          {/* Status Bar - Show selected item or ready to checkout */}
          <div className="bg-black border-t-2 border-gray-700 p-2">
            {selectedCartIndex !== null ? (
              <div className="text-center space-y-1 py-1">
                <div className="text-yellow-400 font-bold text-base">EDIT QUANTITY MODE</div>
                <div className="text-xs text-yellow-300">Type numbers with keypad • Press ADD or ENT to apply</div>
              </div>
            ) : cart.length > 0 ? (
              <div className="text-center space-y-1 py-1">
                <div className="text-green-400 font-bold text-base">READY TO PAY</div>
                <div className="text-xs text-green-300">Click item to edit qty • Press ENT to complete</div>
              </div>
            ) : (
              <div className="text-center text-gray-500 font-bold text-sm">
                Scan product to start
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        total={total}
        onComplete={handlePaymentComplete}
      />

      {/* Receipt Modal */}
      <Receipt
        isOpen={showBill}
        onClose={setShowBill}
        cart={cart}
        saleId={saleId}
        paymentDetails={paymentDetails}
        billDiscount={billDiscountPercent}
        onPrint={printBill}
        onNewSale={handleNewSale}
      />

      {/* Hidden Thermal Receipt for Printing */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <ThermalReceipt 
          cart={cart} 
          saleId={saleId} 
          paymentDetails={paymentDetails} 
          billDiscount={billDiscountPercent}
        />
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
