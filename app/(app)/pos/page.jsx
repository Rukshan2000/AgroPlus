'use client'

import React, { useState, useEffect } from 'react'
import { ShoppingCart, CheckCircle, LogOut, Undo2, Printer } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useSession } from '@/hooks/use-session'
import ProductInput from '@/components/pos/ProductInput'
import Cart from '@/components/pos/Cart'
import Receipt from '@/components/pos/Receipt'
import ThermalReceipt from '@/components/pos/ThermalReceipt'
import PriceVariationModal from '@/components/pos/price-variation-modal'
import POSReturnModal from '@/components/pos-return-modal'
import PaymentModal from '@/components/pos/payment-modal'
import { Button } from '@/components/ui/button'
import { ConnectionStatusBadge } from '@/components/connection-status'
import ThemeToggle from '@/components/theme-toggle'
import offlineProductModel from '@/models/offlineProductModel'
import offlineSalesModel from '@/models/offlineSalesModel'

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

  const handlePrintProductList = () => {
    try {
      // Group products by category
      const productsByCategory = {}
      products.forEach(product => {
        const category = product.category || 'Uncategorized'
        if (!productsByCategory[category]) {
          productsByCategory[category] = []
        }
        productsByCategory[category].push(product)
      })

      // Create print window
      const printWindow = window.open('', '_blank')
      
      // Generate HTML for product list
      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Product List - Green Plus Agro</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              font-size: 14px;
            }
            h1 {
              text-align: center;
              color: #059669;
              margin-bottom: 5px;
            }
            .subtitle {
              text-align: center;
              color: #666;
              margin-bottom: 20px;
            }
            .category {
              margin-top: 25px;
              page-break-inside: avoid;
            }
            .category-header {
              background: #059669;
              color: white;
              padding: 8px 12px;
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              background: #f3f4f6;
              padding: 8px;
              text-align: left;
              border: 1px solid #ddd;
              font-weight: bold;
            }
            td {
              padding: 8px;
              border: 1px solid #ddd;
            }
            tr:nth-child(even) {
              background: #f9fafb;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #666;
              font-size: 12px;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <h1>Green Plus Agro - Product List</h1>
          <div class="subtitle">Complete Product Inventory - ${new Date().toLocaleDateString()}</div>
          <button class="no-print" onclick="window.print()" style="padding: 10px 20px; background: #059669; color: white; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 20px;">Print</button>
      `

      // Add each category and its products
      Object.keys(productsByCategory).sort().forEach(category => {
        html += `
          <div class="category">
            <div class="category-header">${category}</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 15%;">ID</th>
                  <th style="width: 60%;">Product Name</th>
                  <th style="width: 25%;">Price (LKR)</th>
                </tr>
              </thead>
              <tbody>
        `
        
        productsByCategory[category].forEach(product => {
          html += `
                <tr>
                  <td>${product.id}</td>
                  <td>${product.name}</td>
                  <td style="text-align: right;">${parseFloat(product.price || 0).toFixed(2)}</td>
                </tr>
          `
        })

        html += `
              </tbody>
            </table>
          </div>
        `
      })

      // Add footer
      html += `
          <div class="footer">
            <p>Total Products: ${products.length} | Categories: ${Object.keys(productsByCategory).length}</p>
            <p>Printing Date: ${new Date().toLocaleString()}</p>
          </div>
        </body>
        </html>
      `

      printWindow.document.write(html)
      printWindow.document.close()

      toast({
        title: "Success",
        description: "Product list opened in new window",
      })
    } catch (error) {
      console.error('Print error:', error)
      toast({
        title: "Error",
        description: "Failed to generate product list",
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
    
    // Filter out shopping bag from grid display (unless specifically searching for it)
    if (!productSearch || !productSearch.toLowerCase().includes('bag')) {
      productsToShow = productsToShow.filter(product => 
        !product.name.toLowerCase().includes('shopping bag') &&
        !product.name.toLowerCase().includes('carrier bag') &&
        !product.name.toLowerCase().includes('polythene bag')
      )
    }
    
    if (productSearch) {
      productsToShow = productsToShow.filter(product => 
        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.sku?.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.id.toString().includes(productSearch)
      )
    } else {
      productsToShow = productsToShow.slice(0, 24) // Limit to 24 for performance
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

  const addProductToCart = (product, priceVariation = null, incrementByOne = false) => {
    // Check if product is already in cart (with same variation if applicable)
    const variationKey = priceVariation ? `${product.id}-${priceVariation.id}` : product.id
    const existingItemIndex = cart.findIndex(item => {
      if (priceVariation) {
        return item.id === product.id && item.variationId === priceVariation.id
      }
      return item.id === product.id && !item.variationId
    })
    
    // Use 1 for increment clicks, or the manual quantity for manual additions
    const qty = incrementByOne ? 1 : (parseFloat(quantity) || 1)
    const productPrice = priceVariation ? priceVariation.price : getProductPrice(product)
    const discountPercent = parseFloat(discount) || 0
    const discountAmount = (productPrice * discountPercent) / 100
    const finalPrice = productPrice - discountAmount

    if (existingItemIndex >= 0) {
      // Product already in cart, increase quantity
      const existingItem = cart[existingItemIndex]
      const newQuantity = parseFloat((existingItem.quantity + qty).toFixed(2)) // Round to 2 decimal places
      
      if (newQuantity > product.available_quantity) {
        toast({
          title: "Insufficient stock",
          description: `Only ${product.available_quantity} units available. Current cart has ${existingItem.quantity}.`,
          variant: "destructive"
        })
        setQuantity(Math.max(0.01, product.available_quantity - existingItem.quantity).toString())
        return
      }

      // Update existing item quantity
      setCart(prev => prev.map((item, index) => 
        index === existingItemIndex 
          ? { 
              ...item, 
              quantity: newQuantity, 
              total: parseFloat((finalPrice * newQuantity).toFixed(2)),
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
        total: parseFloat((finalPrice * qty).toFixed(2)),
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
    setQuantity('1') // Reset to 1
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
        ? { ...item, quantity: newQty, total: parseFloat((item.unitPrice * newQty).toFixed(2)) }
        : item
    ))
  }

  const subtotal = parseFloat(cart.reduce((sum, item) => sum + item.total, 0).toFixed(2))
  const billDiscountPercent = parseFloat(billDiscount) || 0
  const billDiscountAmount = parseFloat(((subtotal * billDiscountPercent) / 100).toFixed(2))
  const total = parseFloat((subtotal - billDiscountAmount).toFixed(2))

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
      const saleData = {
        items: cart.map(item => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          original_price: item.originalPrice,
          discount_percentage: item.discount,
          discount_amount: parseFloat(((item.originalPrice - item.unitPrice) * item.quantity).toFixed(2)),
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
          setQuantity(parseFloat((parseFloat(quantity) + 1).toFixed(2)).toString())
          break
        case '-':
          e.preventDefault()
          setQuantity(Math.max(1, parseFloat(quantity) - 1).toString())
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [cart.length, productId, quantity, filteredProducts, selectedProductIndex, isCashier, initiatePayment, clearCart, addToCart, handleLogout])
  
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
            {/* Connection Status + Theme Toggle */}
            <div className="flex items-center gap-2">
              <ConnectionStatusBadge />
              <ThemeToggle />
            </div>
            
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

            {/* Print Products Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintProductList}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Products
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
            <div className="text-xs text-gray-600 dark:text-gray-300 space-x-3 hidden lg:flex">
              <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded font-mono">Ctrl+Q</kbd> Product</span>
              <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded font-mono">Ctrl+↵</kbd> Sale</span>
              <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded font-mono">Ctrl+K</kbd> Clear</span>
              <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded font-mono">Ctrl+/</kbd> Search</span>
              <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded font-mono">←→↑↓</kbd> Navigate</span>
              {isCashier && <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded font-mono">Ctrl+L</kbd> Logout</span>}
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
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                <span>Product ID/SKU/Name</span>
                <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-mono">Ctrl+Q</kbd>
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
                  onClick={() => setQuantity(Math.max(1, parseFloat(quantity) - 1).toString())}
                  className="h-12 w-12 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-l-lg border border-r-0 flex items-center justify-center"
                >
                  <span className="text-lg font-bold">−</span>
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  step="0.01"
                  min="0.01"
                  className="h-12 w-20 text-center text-lg font-bold border-t border-b focus:ring-2 focus:ring-blue-500 dark:bg-black dark:border-gray-600 dark:text-gray-100"
                />
                <button
                  onClick={() => setQuantity(parseFloat((parseFloat(quantity) + 1).toFixed(2)).toString())}
                  className="h-12 w-12 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-r-lg border border-l-0 flex items-center justify-center"
                >
                  <span className="text-lg font-bold">+</span>
                </button>
              </div>
            </div>

            {/* Discount - 2 columns */}
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Global Discount % {discount && parseFloat(discount) > 0 && (
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
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-lg transition-colors duration-150 focus:ring-2 focus:ring-green-500 flex items-center justify-center gap-2"
                title="Add to Cart (Enter)"
              >
                ADD TO CART
                <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-xs font-mono">↵</kbd>
              </button>
            </div>

            {/* Quick Clear - 2 columns */}
            <div className="col-span-2">
              <button
                onClick={clearCart}
                disabled={cart.length === 0}
                className="w-full h-12 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold text-lg rounded-lg transition-colors duration-150 flex items-center justify-center gap-2"
              >
                CLEAR CART
                <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-xs font-mono">Ctrl+K</kbd>
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
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full h-10 px-4 pr-16 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-black dark:border-gray-600 dark:text-gray-100"
                      placeholder="Search products..."
                    />
                    <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs font-mono">
                      Ctrl+/
                    </kbd>
                  </div>
                  
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
                    data-product-index={index}
                    onClick={async () => {
                      // Update selected index on click
                      setSelectedProductIndex(index)
                      
                      if (product.available_quantity <= 0) {
                        toast({
                          title: "Out of stock",
                          description: `${product.name} is currently out of stock`,
                          variant: "destructive"
                        })
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
                      addProductToCart(product, null, true)
                    }}
                    className={`p-3 hover:shadow-md rounded-lg border-2 text-left transition-all duration-150 transform hover:scale-105 relative ${
                      // Keyboard navigation highlight
                      index === selectedProductIndex
                        ? 'ring-4 ring-blue-500 ring-offset-2 dark:ring-offset-black scale-105 shadow-xl'
                        : ''
                    } ${
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
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
                <ShoppingCart className="h-5 w-5" />
                Cart ({cart.length} items)
              </h3>

              {/* Quick Add Shopping Bags */}
              <div className="mb-3 p-2 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="text-xs font-semibold text-orange-700 dark:text-orange-300 mb-2">
                  🛍️ Quick Add Bags
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {/* Medium Bag Button */}
                  <button
                    onClick={() => {
                      const mediumBag = products.find(p => 
                        p.name.toLowerCase().includes('shopping bag medium')
                      )
                      
                      if (!mediumBag) {
                        toast({
                          title: "Product not found",
                          description: "Medium shopping bag not found",
                          variant: "destructive"
                        })
                        return
                      }

                      if (mediumBag.available_quantity <= 0) {
                        toast({
                          title: "Out of stock",
                          description: "Medium bags out of stock",
                          variant: "destructive"
                        })
                        return
                      }

                      const existingItemIndex = cart.findIndex(item => item.id === mediumBag.id)
                      const bagPrice = getProductPrice(mediumBag)
                      
                      if (existingItemIndex >= 0) {
                        const existingItem = cart[existingItemIndex]
                        const newQuantity = existingItem.quantity + 1
                        
                        if (newQuantity > mediumBag.available_quantity) {
                          toast({
                            title: "Insufficient stock",
                            description: `Only ${mediumBag.available_quantity} bags available`,
                            variant: "destructive"
                          })
                          return
                        }

                        setCart(prev => prev.map((item, index) => 
                          index === existingItemIndex 
                            ? { 
                                ...item, 
                                quantity: newQuantity, 
                                total: parseFloat((bagPrice * newQuantity).toFixed(2))
                              }
                            : item
                        ))

                        toast({
                          title: "Added",
                          description: `Medium bag ×${newQuantity}`,
                          duration: 800
                        })
                      } else {
                        const cartItem = {
                          id: mediumBag.id,
                          sku: mediumBag.sku,
                          name: mediumBag.name,
                          originalPrice: bagPrice,
                          quantity: 1,
                          discount: 0,
                          unitPrice: bagPrice,
                          total: bagPrice,
                          availableStock: mediumBag.available_quantity
                        }

                        setCart(prev => [...prev, cartItem])

                        toast({
                          title: "Added",
                          description: "Medium bag ×1",
                          duration: 800
                        })
                      }
                    }}
                    className="h-10 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                    title="Add Medium Shopping Bag (LKR 3.00)"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Medium (3.00)
                  </button>

                  {/* Large Bag Button */}
                  <button
                    onClick={() => {
                      const largeBag = products.find(p => 
                        p.name.toLowerCase().includes('shopping bag large')
                      )
                      
                      if (!largeBag) {
                        toast({
                          title: "Product not found",
                          description: "Large shopping bag not found",
                          variant: "destructive"
                        })
                        return
                      }

                      if (largeBag.available_quantity <= 0) {
                        toast({
                          title: "Out of stock",
                          description: "Large bags out of stock",
                          variant: "destructive"
                        })
                        return
                      }

                      const existingItemIndex = cart.findIndex(item => item.id === largeBag.id)
                      const bagPrice = getProductPrice(largeBag)
                      
                      if (existingItemIndex >= 0) {
                        const existingItem = cart[existingItemIndex]
                        const newQuantity = existingItem.quantity + 1
                        
                        if (newQuantity > largeBag.available_quantity) {
                          toast({
                            title: "Insufficient stock",
                            description: `Only ${largeBag.available_quantity} bags available`,
                            variant: "destructive"
                          })
                          return
                        }

                        setCart(prev => prev.map((item, index) => 
                          index === existingItemIndex 
                            ? { 
                                ...item, 
                                quantity: newQuantity, 
                                total: parseFloat((bagPrice * newQuantity).toFixed(2))
                              }
                            : item
                        ))

                        toast({
                          title: "Added",
                          description: `Large bag ×${newQuantity}`,
                          duration: 800
                        })
                      } else {
                        const cartItem = {
                          id: largeBag.id,
                          sku: largeBag.sku,
                          name: largeBag.name,
                          originalPrice: bagPrice,
                          quantity: 1,
                          discount: 0,
                          unitPrice: bagPrice,
                          total: bagPrice,
                          availableStock: largeBag.available_quantity
                        }

                        setCart(prev => [...prev, cartItem])

                        toast({
                          title: "Added",
                          description: "Large bag ×1",
                          duration: 800
                        })
                      }
                    }}
                    className="h-10 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                    title="Add Large Shopping Bag (LKR 5.00)"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Large (5.00)
                  </button>
                </div>
              </div>

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
                              onClick={() => updateQuantity(index, parseFloat((item.quantity - 1).toFixed(2)))}
                              className="w-7 h-7 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded text-sm font-bold transition-colors"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(index, parseFloat(e.target.value) || 0.01)}
                              step="0.01"
                              min="0.01"
                              className="w-12 h-7 text-center text-sm font-mono bg-white dark:bg-black border border-gray-300 dark:border-gray-600 rounded"
                              max={item.availableStock}
                            />
                            <button
                              onClick={() => updateQuantity(index, parseFloat((item.quantity + 1).toFixed(2)))}
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
                    
                    {/* Bill Discount Input */}
                    <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <label className="text-sm font-semibold text-orange-700 dark:text-orange-300 whitespace-nowrap">
                        Bill Discount:
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={billDiscount}
                        onChange={(e) => setBillDiscount(e.target.value)}
                        placeholder="0"
                        className="w-20 px-2 py-1 text-sm border border-orange-300 dark:border-orange-700 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-800"
                      />
                      <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">%</span>
                      {billDiscountAmount > 0 && (
                        <span className="ml-auto text-sm font-bold text-orange-600 dark:text-orange-400">
                          -LKR {billDiscountAmount.toFixed(2)}
                        </span>
                      )}
                    </div>
                    
                    <div className="border-t dark:border-gray-600 pt-2">
                      <div className="flex justify-between text-2xl font-bold text-green-600 dark:text-green-400">
                        <span>TOTAL:</span>
                        <span>LKR {total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={initiatePayment}
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