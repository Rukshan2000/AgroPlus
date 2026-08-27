'use client'

import React, { useState, useEffect } from 'react'
import { ShoppingCart, CheckCircle, LogOut, Undo2, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useSession } from '@/hooks/use-session'
import ProductInput from '@/components/pos/ProductInput'
import Cart from '@/components/pos/Cart'
import Receipt from '@/components/pos/Receipt'
import ThermalReceipt from '@/components/pos/ThermalReceipt'
import PriceVariationModal from '@/components/pos/price-variation-modal'
import ProductQuantityModal from '@/components/pos/product-quantity-modal'
import POSReturnModal from '@/components/pos-return-modal'
import PaymentModal from '@/components/pos/payment-modal'
import InsufficientStockWarning from '@/components/pos/insufficient-stock-warning'
import PrintProductsButton from '@/components/pos/print-products-button'
import CashDrawerButton from '@/components/pos/cash-drawer-button'
import VirtualKeyboard from '@/components/pos/virtual-keyboard'
import { CustomerFormModal } from '@/components/customer-form-modal'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/theme-toggle'
import ScreenSizeChanger from '@/components/pos/screen-size-changer'

export default function POSSystem() {
  const [cart, setCart] = useState([])
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [billDiscount, setBillDiscount] = useState('') // Whole bill discount
  const [billDiscountByPrice, setBillDiscountByPrice] = useState('') // Bill discount by final price
  const [billDiscountType, setBillDiscountType] = useState('percentage') // 'percentage' or 'price'
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
  const [showProductQuantityModal, setShowProductQuantityModal] = useState(false)
  const [selectedProductForQuantity, setSelectedProductForQuantity] = useState(null)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [saleId, setSaleId] = useState(null) // Store sale ID for receipt
  const [selectedProductIndex, setSelectedProductIndex] = useState(0) // For arrow key navigation
  const [selectedOutlet, setSelectedOutlet] = useState(null) // Store selected outlet
  const [selectedCartIndex, setSelectedCartIndex] = useState(null) // For cart item quantity/discount editing
  const [cartInputQty, setCartInputQty] = useState('') // Temporary quantity input for selected cart item
  const [cartInputDiscount, setCartInputDiscount] = useState('') // Temporary per-item discount for selected cart item
  const [cartDiscountType, setCartDiscountType] = useState('percentage') // 'percentage' or 'price' for the selected cart item
  const [cartEditField, setCartEditField] = useState('qty') // Which field the keypad types into: 'qty' | 'discount'
  const [showStockWarning, setShowStockWarning] = useState(false) // Stock warning modal
  const [stockWarningData, setStockWarningData] = useState(null) // Data for stock warning modal
  const [discountMode, setDiscountMode] = useState(null) // 'item' or 'bill' for discount editing via keyboard
  const [discountInputValue, setDiscountInputValue] = useState('') // Temporary discount value
  const [showCustomerModal, setShowCustomerModal] = useState(false) // Show/hide create customer modal
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

  // NOTE: The item discount input applies only to the NEXT item added to the cart.
  // Items already in the cart keep the discount they were added with (stored per
  // item as discount/unitPrice/total), so changing this input must not touch them.

  const loadProducts = async (outletId) => {
    try {
      let url
      
      // If outlet is selected, load distributed products for that outlet
      if (outletId) {
        url = `/api/products/distributed?outlet_id=${outletId}&limit=1000&is_active=true`
      } else {
        // Fallback to all active products if no outlet
        url = '/api/products?limit=1000&is_active=true'
      }

      console.log('Loading products from:', url)
      const response = await fetch(url, { credentials: 'include' })
      
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      } else {
        // Log the error response for debugging
        const errorText = await response.text()
        console.error('Products API error:', response.status, errorText)
        
        // If distributed endpoint fails, fallback to regular products
        if (outletId) {
          console.log('Falling back to regular products API')
          const fallbackResponse = await fetch('/api/products?limit=1000&is_active=true', { credentials: 'include' })
          if (fallbackResponse.ok) {
            const data = await fallbackResponse.json()
            setProducts(data.products || [])
            return
          }
        }
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
        const response = await fetch('/api/products?limit=1000&is_active=true', { credentials: 'include' })
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

  // Calculate discount percentage from selling price
  const calculateDiscountFromPrice = (originalPrice, sellingPrice) => {
    if (!originalPrice || !sellingPrice || originalPrice <= 0 || sellingPrice < 0) return 0
    if (sellingPrice >= originalPrice) return 0
    const discount = ((originalPrice - sellingPrice) / originalPrice) * 100
    return Math.max(0, Math.min(100, discount)) // Clamp between 0-100
  }

  // Get effective bill discount percentage (for percentage mode) or amount (for PKR mode)
  const getBillDiscountPercent = () => {
    if (billDiscountType === 'price' && billDiscountByPrice) {
      // In PKR mode, return the amount directly (will be handled differently in calculations)
      return Math.max(0, parseFloat(billDiscountByPrice)) // Returns PKR amount, not a percentage
    }
    return parseFloat(billDiscount) || 0
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
    
    // Items are added at full price; discounts are applied per line by
    // clicking the item in the cart (see applyCartItemEdits).
    const finalPrice = productPrice
    const discountPercent = 0

    if (existingItemIndex >= 0) {
      // Product already in cart, increase quantity
      const existingItem = cart[existingItemIndex]
      const newQuantity = existingItem.quantity + qty
      
      if (newQuantity > product.available_quantity) {
        // Show warning modal instead of just toast
        setStockWarningData({
          productName: product.name,
          availableQuantity: product.available_quantity,
          requestedQuantity: qty,
          currentCartQuantity: existingItem.quantity,
          product,
          priceVariation,
          isUpdating: true,
          existingItemIndex
        })
        setShowStockWarning(true)
        return // Don't reset quantity, keep it for user review
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

      // Reset inputs after successful add
      setProductId('')
      setProductSearch('')
      setQuantity('1')
      setTimeout(() => {
        document.querySelector('input[placeholder="SCAN/TYPE PRODUCT..."]')?.focus()
      }, 100)
    } else {
      // Product not in cart, add new item
      if (qty > product.available_quantity) {
        // Show warning modal instead of just toast
        setStockWarningData({
          productName: product.name,
          availableQuantity: product.available_quantity,
          requestedQuantity: qty,
          currentCartQuantity: 0,
          product,
          priceVariation,
          isUpdating: false
        })
        setShowStockWarning(true)
        return // Don't reset quantity, keep it for user review
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

      // Reset inputs after successful add
      setProductId('')
      setProductSearch('')
      setQuantity('1')
      setTimeout(() => {
        document.querySelector('input[placeholder="SCAN/TYPE PRODUCT..."]')?.focus()
      }, 100)
    }
  }

  const handleVariationSelect = (variation) => {
    if (selectedProductForVariation) {
      addProductToCart(selectedProductForVariation, variation)
      setSelectedProductForVariation(null)
    }
  }

  // Handle adding product to cart from quantity modal
  const handleQuantityModalAddToCart = (product, priceVariation, quantity) => {
    // Check if product is already in cart (with same variation if applicable)
    const variationKey = priceVariation ? `${product.id}-${priceVariation.id}` : product.id
    const existingItemIndex = cart.findIndex(item => {
      if (priceVariation) {
        return item.id === product.id && item.variationId === priceVariation.id
      }
      return item.id === product.id && !item.variationId
    })

    const productPrice = priceVariation ? priceVariation.price : getProductPrice(product)
    
    // Items are added at full price; discounts are applied per line by
    // clicking the item in the cart (see applyCartItemEdits).
    const finalPrice = productPrice
    const discountPercent = 0

    if (existingItemIndex >= 0) {
      // Product already in cart, increase quantity
      const existingItem = cart[existingItemIndex]
      const newQuantity = existingItem.quantity + quantity

      if (newQuantity > product.available_quantity) {
        // Show warning modal instead of just toast
        setStockWarningData({
          productName: product.name,
          availableQuantity: product.available_quantity,
          requestedQuantity: quantity,
          currentCartQuantity: existingItem.quantity,
          product,
          priceVariation,
          isUpdating: true,
          existingItemIndex
        })
        setShowStockWarning(true)
        return // Don't reset quantity, keep it for user review
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
      if (quantity > product.available_quantity) {
        // Show warning modal instead of just toast
        setStockWarningData({
          productName: product.name,
          availableQuantity: product.available_quantity,
          requestedQuantity: quantity,
          currentCartQuantity: 0,
          product,
          priceVariation,
          isUpdating: false
        })
        setShowStockWarning(true)
        return // Don't reset quantity, keep it for user review
      }

      const cartItem = {
        id: product.id,
        sku: product.sku,
        name: product.name,
        variationId: priceVariation?.id || null,
        variationName: priceVariation?.variant_name || null,
        originalPrice: productPrice,
        quantity: quantity,
        discount: discountPercent,
        unitPrice: finalPrice,
        total: finalPrice * quantity,
        availableStock: product.available_quantity
      }

      setCart(prev => [...prev, cartItem])

      toast({
        title: "Added to cart",
        description: `${product.name}${priceVariation ? ` (${priceVariation.variant_name})` : ''} × ${quantity}${discountPercent > 0 ? ` (${discountPercent}% off)` : ''}`,
        duration: 1000
      })
    }
  }

  // Handle product click from grid - show quantity modal
  const handleProductClick = async (product) => {
    if (product.available_quantity <= 0) {
      toast({
        title: "Out of stock",
        description: `${product.name} is currently out of stock`,
        variant: "destructive"
      })
      return
    }

    // Show quantity modal for all products
    setSelectedProductForQuantity(product)
    setShowProductQuantityModal(true)
  }

  const handleStockWarningConfirm = () => {
    if (!stockWarningData) return

    const { product, priceVariation, isUpdating, existingItemIndex, isCartEdit, cartIndex } = stockWarningData
    const maxAvailable = Math.max(0, product.available_quantity - (stockWarningData.currentCartQuantity || 0))

    // Handle cart item edit case (when user edits quantity/discount from cart)
    if (isCartEdit && cartIndex !== undefined) {
      const item = cart[cartIndex]
      // Keep the discount the user was typing in the edit panel
      const { percent, unitPrice } = resolveDiscount(
        item.originalPrice,
        maxAvailable,
        cartInputDiscount,
        cartDiscountType
      )

      setCart(prev => prev.map((cartItem, i) =>
        i === cartIndex
          ? {
              ...cartItem,
              quantity: maxAvailable,
              discount: percent,
              discountType: cartDiscountType,
              discountValue: parseFloat(cartInputDiscount) || 0,
              unitPrice,
              total: unitPrice * maxAvailable
            }
          : cartItem
      ))

      toast({
        title: "Quantity updated",
        description: `${item.name} quantity set to ${maxAvailable} (Maximum available)`,
        duration: 1000
      })

      closeCartEdit()
      setShowStockWarning(false)
      setStockWarningData(null)
      
      setTimeout(() => {
        document.querySelector('input[placeholder="SCAN/TYPE PRODUCT..."]')?.focus()
      }, 100)
      return
    }
    
    // Set quantity to maximum available
    setQuantity(maxAvailable.toString())

    const productPrice = priceVariation ? priceVariation.price : getProductPrice(product)
    
    // Items are added at full price; discounts are applied per line by
    // clicking the item in the cart (see applyCartItemEdits).
    const finalPrice = productPrice
    const discountPercent = 0

    if (isUpdating && existingItemIndex !== undefined) {
      // Update existing item
      const newQuantity = stockWarningData.currentCartQuantity + maxAvailable
      setCart(prev => prev.map((item, index) => 
        index === existingItemIndex 
          ? { 
              ...item, 
              quantity: newQuantity, 
              total: finalPrice * newQuantity,
              discount: discountPercent,
              unitPrice: finalPrice
            }
          : item
      ))

      toast({
        title: "Quantity updated",
        description: `${product.name} quantity updated to ${newQuantity}${discountPercent > 0 ? ` (${discountPercent}% off)` : ''}`,
        duration: 1000
      })
    } else {
      // Add new item with maximum available
      const cartItem = {
        id: product.id,
        sku: product.sku,
        name: product.name,
        variationId: priceVariation?.id || null,
        variationName: priceVariation?.variant_name || null,
        originalPrice: productPrice,
        quantity: maxAvailable,
        discount: discountPercent,
        unitPrice: finalPrice,
        total: finalPrice * maxAvailable,
        availableStock: product.available_quantity
      }

      setCart(prev => [...prev, cartItem])

      toast({
        title: "Added to cart",
        description: `${product.name}${priceVariation ? ` (${priceVariation.variant_name})` : ''} × ${maxAvailable} (Maximum available)${discountPercent > 0 ? ` (${discountPercent}% off)` : ''}`,
        duration: 1000
      })
    }

    setProductId('')
    setProductSearch('')
    setQuantity('1')
    setShowStockWarning(false)
    setStockWarningData(null)

    // Auto-focus back to product input for next item
    setTimeout(() => {
      document.querySelector('input[placeholder="SCAN/TYPE PRODUCT..."]')?.focus()
    }, 100)
  }

  const removeFromCart = (index) => {
    const item = cart[index]
    setCart(prev => prev.filter((_, i) => i !== index))
    toast({
      title: "Item removed",
      description: `${item.name} removed from cart`
    })
  }

  // Resolve a discount entered as either a percentage or a flat LKR amount into
  // the canonical { percent, unitPrice, amount } used by the cart/receipt.
  // A LKR discount is taken off the LINE TOTAL (price x qty), not the unit price:
  // qty 5 @ LKR 10 with a LKR 20 discount => line 50 - 20 = 30, unit price 6.
  const resolveDiscount = (originalPrice, quantity, value, type) => {
    const raw = Math.max(0, parseFloat(value) || 0)
    const qty = parseFloat(quantity) || 0
    const lineTotal = originalPrice * qty

    if (type === 'price') {
      const amount = Math.min(raw, lineTotal) // never below zero
      const unitPrice = qty > 0 ? (lineTotal - amount) / qty : originalPrice
      const percent = lineTotal > 0 ? (amount / lineTotal) * 100 : 0
      return { percent, unitPrice, amount }
    }

    const percent = Math.min(100, raw)
    const unitPrice = originalPrice - (originalPrice * percent) / 100
    return { percent, unitPrice, amount: (originalPrice - unitPrice) * qty }
  }

  // Apply quantity + per-item discount to a single cart line (used by the
  // click-to-edit panel). Only ever touches the item at `index`.
  const applyCartItemEdits = (index, newQty, newDiscountValue, newDiscountType) => {
    if (newQty <= 0) {
      removeFromCart(index)
      closeCartEdit()
      return
    }

    const item = cart[index]
    if (!item) {
      toast({
        title: "Item not found",
        description: "Could not update that cart line",
        variant: "destructive"
      })
      closeCartEdit()
      return
    }

    // Only enforce a stock ceiling when we actually know the stock
    if (Number.isFinite(item.availableStock) && newQty > item.availableStock) {
      setStockWarningData({
        productName: item.name,
        availableQuantity: item.availableStock,
        requestedQuantity: newQty,
        currentCartQuantity: 0,
        product: {
          id: item.id,
          name: item.name,
          available_quantity: item.availableStock
        },
        priceVariation: item.variationId ? { id: item.variationId, variant_name: item.variationName } : null,
        isCartEdit: true,
        cartIndex: index
      })
      setShowStockWarning(true)
      return
    }

    const { percent, unitPrice, amount } = resolveDiscount(
      item.originalPrice,
      newQty,
      newDiscountValue,
      newDiscountType
    )

    setCart(prev => prev.map((cartItem, i) =>
      i === index
        ? {
            ...cartItem,
            quantity: newQty,
            discount: percent,
            // Remember how the user entered it so reopening shows the same thing
            discountType: newDiscountType,
            discountValue: parseFloat(newDiscountValue) || 0,
            unitPrice,
            total: unitPrice * newQty
          }
        : cartItem
    ))

    const discountLabel = newDiscountType === 'price'
      ? ` (-LKR ${amount.toFixed(2)})`
      : ` (-${percent.toFixed(1)}%)`

    toast({
      title: "Item updated",
      description: `${item.name} × ${newQty}${amount > 0 ? discountLabel : ''}`,
      duration: 800
    })

    closeCartEdit()
  }

  const closeCartEdit = () => {
    setSelectedCartIndex(null)
    setCartInputQty('')
    setCartInputDiscount('')
    setCartDiscountType('percentage')
    setCartEditField('qty')
  }

  const openCartEdit = (index) => {
    const item = cart[index]
    const type = item.discountType || 'percentage'
    setSelectedCartIndex(index)
    setCartInputQty(item.quantity.toString())
    // Fall back to the stored percentage for items added before a type was tracked
    setCartInputDiscount(
      (item.discountValue !== undefined ? item.discountValue : item.discount || 0).toString()
    )
    setCartDiscountType(type)
    setCartEditField('qty')
  }

  // Apply whatever is currently typed in the cart edit panel
  const commitCartEdit = () => {
    if (selectedCartIndex === null) return
    applyCartItemEdits(
      selectedCartIndex,
      parseFloat(cartInputQty) || 1,
      cartInputDiscount,
      cartDiscountType
    )
  }

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  // Sum of the discounts actually stored on each cart line (not the input field)
  const itemDiscountTotal = cart.reduce(
    (sum, item) => sum + Math.max(0, item.originalPrice - item.unitPrice) * item.quantity,
    0
  )
  const billDiscountAmount = billDiscountType === 'price' && billDiscountByPrice 
    ? Math.min(parseFloat(billDiscountByPrice), subtotal) // PKR mode: flat discount
    : (subtotal * (parseFloat(billDiscount) || 0)) / 100 // Percentage mode
  const billDiscountPercent = billDiscountType === 'price' && billDiscountByPrice && subtotal > 0
    ? ((parseFloat(billDiscountByPrice) / subtotal) * 100) // Calculate as percentage for display
    : (parseFloat(billDiscount) || 0) // Percentage mode value
  const total = Math.max(0, subtotal - billDiscountAmount)

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
    setBillDiscountByPrice('')
    closeCartEdit()
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
      
      // Calculate the actual total after points redemption
      const actualTotal = total - (payment.points_value || 0)
      
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
        total: actualTotal,
        payment_method: payment.method,
        amount_paid: payment.amount_paid,
        change_given: payment.change,
        cashier_id: session?.user?.id,
        cashier_name: session?.user?.name,
        outlet_id: outletId ? parseInt(outletId) : null,
        // Loyalty points data
        customer_id: payment.customer?.id || null,
        points_redeemed: payment.points_redeemed || 0,
        points_value: payment.points_value || 0,
        points_earned: payment.points_earned || 0
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
        
        // Debug log for loyalty points
        console.log('Payment data received:', {
          customer: payment.customer,
          points_redeemed: payment.points_redeemed,
          points_earned: payment.points_earned
        })
        
        // Handle loyalty points - redeem and earn using dedicated loyalty-points API
        if (payment.customer?.id) {
          console.log('Processing loyalty points for customer:', payment.customer.id)
          const csrfToken = await fetch('/api/auth/csrf').then(r => r.json()).then(d => d.csrfToken)
          
          // Redeem points first (if any)
          if (payment.points_redeemed > 0) {
            try {
              const redeemResponse = await fetch(`/api/customers/${payment.customer.id}/loyalty-points`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-csrf-token': csrfToken
                },
                body: JSON.stringify({
                  action: 'redeem',
                  points: payment.points_redeemed,
                  sale_id: firstSaleId,
                  description: `Points payment for Sale #${firstSaleId || 'N/A'}`,
                  payment_value: payment.points_value // LKR value of the points used
                })
              })
              
              if (!redeemResponse.ok) {
                const error = await redeemResponse.json()
                console.error('Failed to redeem points:', error)
              } else {
                console.log('Points redeemed successfully:', payment.points_redeemed)
              }
            } catch (redeemError) {
              console.error('Error redeeming loyalty points:', redeemError)
            }
          }
          
          // Earn points from purchase
          if (payment.points_earned > 0) {
            try {
              const earnResponse = await fetch(`/api/customers/${payment.customer.id}/loyalty-points`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-csrf-token': csrfToken
                },
                body: JSON.stringify({
                  action: 'earn',
                  points: payment.points_earned,
                  sale_id: firstSaleId,
                  description: `Earned from purchase - Sale #${firstSaleId || 'N/A'}`
                })
              })
              
              if (!earnResponse.ok) {
                const error = await earnResponse.json()
                console.error('Failed to earn points:', error)
              } else {
                console.log('Points earned successfully:', payment.points_earned)
              }
            } catch (earnError) {
              console.error('Error earning loyalty points:', earnError)
            }
          }
        }
        
        setShowBill(true);
        toast({
          title: "Sale completed",
          description: payment.customer 
            ? `Transaction processed. ${payment.points_earned > 0 ? `Customer earned ${payment.points_earned} points.` : ''}`
            : "Transaction processed successfully"
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
    // Get outlet from localStorage or state
    const outletId = localStorage.getItem('selectedOutlet') || selectedOutlet
    console.log('handleReturnSuccess - reloading products for outlet:', outletId)
    if (outletId) {
      loadProducts(outletId)
    } else {
      loadProducts(null)
    }
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
            <button
              onClick={() => setShowReturnModal(true)}
              className="h-7 px-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs border-2 border-red-900 rounded-none"
              title="Process returns"
            >
              <Undo2 className="h-3 w-3 inline mr-1" />
              RETURNS
            </button>
            <PrintProductsButton products={products} />
            <CashDrawerButton />
            <button
              onClick={() => setShowCustomerModal(true)}
              className="h-7 px-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs border-2 border-blue-900 rounded-none"
              title="Create new customer"
            >
              <Plus className="h-3 w-3 inline mr-1" />
              CUSTOMER
            </button>
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
                    // Apply qty + discount if a cart item is selected
                    commitCartEdit()
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
                    handleProductClick(product)
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
                    <div className="flex flex-col items-end gap-0.5">
                      <span className={`text-xs px-2 py-1 rounded-none font-bold ${
                        (product.outlet_available_quantity || product.available_quantity) > 10 
                          ? 'bg-green-700 text-white'
                          : (product.outlet_available_quantity || product.available_quantity) > 0
                          ? 'bg-yellow-700 text-white'
                          : 'bg-red-700 text-white'
                      }`}>
                        Stock: {product.outlet_available_quantity ?? product.available_quantity}
                      </span>
                      {product.total_available_quantity && (
                        <span className="text-xs px-1 text-gray-400 truncate">
                          WH: {product.total_available_quantity}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Discount Section - Compact */}
          <div className="bg-gray-900 border-t-2 border-gray-700 px-3 py-2 border-b-2">
            <div className="flex items-center gap-4">
              {/* Per-item discounts are set by clicking a line in the cart */}
              <span className="text-xs text-gray-400 font-bold">
                Item discount: click an item in the cart →
              </span>

              <div className="w-px h-9 bg-gray-600"></div>

              {/* Bill Discount */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-orange-400 font-bold">Bill:</span>
                {/* Mode Toggle */}
                <div className="flex gap-1 border-2 border-orange-700 rounded-none">
                  <button
                    onClick={() => {
                      setBillDiscountType('percentage')
                      setBillDiscountByPrice('')
                    }}
                    className={`px-2 h-7 text-xs font-bold border-r-2 border-orange-700 ${billDiscountType === 'percentage' ? 'bg-orange-600 text-white' : 'bg-orange-900 text-orange-100 hover:bg-orange-800'}`}
                  >
                    %
                  </button>
                  <button
                    onClick={() => {
                      setBillDiscountType('price')
                      setBillDiscount('')
                    }}
                    className={`px-2 h-7 text-xs font-bold ${billDiscountType === 'price' ? 'bg-orange-600 text-white' : 'bg-orange-900 text-orange-100 hover:bg-orange-800'}`}
                  >
                    PKR
                  </button>
                </div>
                
                {/* Input based on mode */}
                {discountMode === 'bill' ? (
                  <input type="text" value={discountInputValue} readOnly className="w-16 h-9 px-2 text-sm font-bold bg-blue-950 text-white border-2 border-blue-600 rounded-none text-center" />
                ) : billDiscountType === 'percentage' ? (
                  <>
                    <input type="number" min="0" max="100" value={billDiscount} onChange={(e) => setBillDiscount(e.target.value)} className="w-16 h-9 px-2 text-sm font-bold bg-gray-800 text-white border-2 border-gray-600 focus:border-orange-500 rounded-none text-center" placeholder="0" />
                    <span className="text-sm text-gray-400">%</span>
                    {[5, 10, 15, 20].map((pct) => (
                      <button key={`bill-${pct}`} onClick={() => setBillDiscount(pct.toString())} className={`h-9 px-3 text-sm font-bold border-2 rounded-none ${billDiscount === pct.toString() ? 'bg-orange-600 border-orange-400 text-white' : 'bg-orange-800 hover:bg-orange-700 border-orange-900 text-orange-100'}`}>{pct}%</button>
                    ))}
                    {billDiscount && parseFloat(billDiscount) > 0 && <button onClick={() => setBillDiscount('')} className="w-9 h-9 bg-red-700 hover:bg-red-800 text-white rounded-none text-sm font-bold">×</button>}
                  </>
                ) : (
                  <>
                    <input type="number" min="0" step="0.01" value={billDiscountByPrice} onChange={(e) => setBillDiscountByPrice(e.target.value)} className="w-24 h-9 px-2 text-sm font-bold bg-gray-800 text-white border-2 border-gray-600 focus:border-orange-500 rounded-none text-center" placeholder="Discount amount" />
                    <span className="text-sm text-gray-400">PKR</span>
                    {billDiscountByPrice && parseFloat(billDiscountByPrice) > 0 && <button onClick={() => setBillDiscountByPrice('')} className="w-9 h-9 bg-red-700 hover:bg-red-800 text-white rounded-none text-sm font-bold">×</button>}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {/* <div className="bg-gray-900 border-t-2 border-gray-700 p-2 grid grid-cols-3 gap-1">
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
          </div> */}
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
                  onClick={() => openCartEdit(index)}
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
                          closeCartEdit()
                        }
                      }}
                      className="w-7 h-7 bg-red-700 hover:bg-red-800 text-white rounded-none flex items-center justify-center text-lg font-bold ml-2 flex-shrink-0"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex justify-between items-center mb-2 text-sm font-bold">
                    <span className="text-gray-300">{selectedCartIndex === index ? 'EDITING:' : `Qty: ${item.quantity}`}</span>
                    <span className="text-green-400 text-base">LKR {item.total.toFixed(2)}</span>
                  </div>
                  {item.discount > 0 && (
                    <div className="flex justify-between items-center mb-2 text-xs font-bold text-yellow-400">
                      <span>LKR {item.originalPrice.toFixed(2)} → {item.unitPrice.toFixed(2)}</span>
                      <span>
                        {item.discountType === 'price'
                          ? `-LKR ${((item.originalPrice - item.unitPrice) * item.quantity).toFixed(2)}`
                          : `-${item.discount.toFixed(1)}%`}
                      </span>
                    </div>
                  )}
                  {selectedCartIndex === index && (
                    <div className="pt-2 border-t border-blue-700 space-y-2" onClick={(e) => e.stopPropagation()}>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-xs text-blue-300 font-bold mb-1 text-left">QTY</div>
                          <input
                            type="number"
                            step="0.01"
                            value={cartInputQty}
                            onFocus={() => setCartEditField('qty')}
                            onChange={(e) => setCartInputQty(e.target.value)}
                            onKeyPress={(e) => { if (e.key === 'Enter') commitCartEdit() }}
                            className={`quantity-input w-full text-center text-white font-bold text-lg bg-blue-950 p-2 border-2 rounded-none ${cartEditField === 'qty' ? 'border-blue-400' : 'border-blue-700'}`}
                            autoFocus
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-yellow-300 font-bold">DISCOUNT</span>
                            {/* Percentage vs flat LKR amount */}
                            <div className="flex border border-yellow-700">
                              <button
                                onClick={() => {
                                  setCartDiscountType('percentage')
                                  setCartInputDiscount('0')
                                  setCartEditField('discount')
                                }}
                                className={`px-2 h-5 text-[10px] font-bold border-r border-yellow-700 ${cartDiscountType === 'percentage' ? 'bg-yellow-600 text-white' : 'bg-yellow-900 text-yellow-100 hover:bg-yellow-800'}`}
                              >
                                %
                              </button>
                              <button
                                onClick={() => {
                                  setCartDiscountType('price')
                                  setCartInputDiscount('0')
                                  setCartEditField('discount')
                                }}
                                className={`px-2 h-5 text-[10px] font-bold ${cartDiscountType === 'price' ? 'bg-yellow-600 text-white' : 'bg-yellow-900 text-yellow-100 hover:bg-yellow-800'}`}
                              >
                                LKR
                              </button>
                            </div>
                          </div>
                          <input
                            type="number"
                            min="0"
                            max={cartDiscountType === 'price'
                              ? item.originalPrice * (parseFloat(cartInputQty) || 0)
                              : 100}
                            step="0.01"
                            value={cartInputDiscount}
                            onFocus={() => setCartEditField('discount')}
                            onChange={(e) => setCartInputDiscount(e.target.value)}
                            onKeyPress={(e) => { if (e.key === 'Enter') commitCartEdit() }}
                            className={`w-full text-center text-white font-bold text-lg bg-yellow-950 p-2 border-2 rounded-none ${cartEditField === 'discount' ? 'border-yellow-400' : 'border-yellow-700'}`}
                          />
                        </div>
                      </div>

                      {/* Quick discount presets for this item only */}
                      <div className="flex gap-1">
                        {(cartDiscountType === 'price'
                          ? [0, 10, 25, 50, 100]
                          : [0, 5, 10, 15, 20]
                        ).map((preset) => (
                          <button
                            key={`cart-disc-${cartDiscountType}-${preset}`}
                            onClick={() => {
                              setCartInputDiscount(preset.toString())
                              setCartEditField('discount')
                            }}
                            className={`flex-1 h-8 text-xs font-bold border-2 rounded-none ${
                              cartInputDiscount === preset.toString()
                                ? 'bg-yellow-600 border-yellow-400 text-white'
                                : 'bg-yellow-900 hover:bg-yellow-800 border-yellow-800 text-yellow-100'
                            }`}
                          >
                            {preset === 0 ? 'None' : cartDiscountType === 'price' ? preset : `${preset}%`}
                          </button>
                        ))}
                      </div>

                      {/* Live preview of this line's new total */}
                      {(() => {
                        const previewQty = parseFloat(cartInputQty) || 0
                        const preview = resolveDiscount(item.originalPrice, previewQty, cartInputDiscount, cartDiscountType)
                        return (
                          <div className="flex justify-between text-xs font-bold text-gray-300">
                            <span>
                              LKR {preview.unitPrice.toFixed(2)} × {previewQty}
                              {preview.amount > 0 && (
                                <span className="text-yellow-400 ml-1">
                                  (-{cartDiscountType === 'price'
                                    ? `LKR ${preview.amount.toFixed(2)}`
                                    : `${preview.percent.toFixed(1)}%`})
                                </span>
                              )}
                            </span>
                            <span className="text-green-400">
                              = LKR {(preview.unitPrice * previewQty).toFixed(2)}
                            </span>
                          </div>
                        )
                      })()}

                      <div className="flex gap-1">
                        <button
                          onClick={commitCartEdit}
                          className="flex-1 h-9 bg-green-700 hover:bg-green-800 text-white font-bold text-sm border-2 border-green-900 rounded-none"
                        >
                          APPLY
                        </button>
                        <button
                          onClick={closeCartEdit}
                          className="flex-1 h-9 bg-gray-700 hover:bg-gray-600 text-white font-bold text-sm border-2 border-gray-800 rounded-none"
                        >
                          CANCEL
                        </button>
                      </div>
                      <div className="text-xs text-blue-300 font-bold text-center">Tap a field, then type or use the keypad • Enter to apply</div>
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
            {itemDiscountTotal > 0 && (
              <div className="flex justify-between text-yellow-400 font-bold text-sm">
                <span>Item Discounts:</span>
                <span>-LKR {itemDiscountTotal.toFixed(2)}</span>
              </div>
            )}
            {billDiscountAmount > 0 && (
              <div className="flex justify-between text-orange-400 font-bold text-base">
                <span>
                  Bill Discount (
                  {billDiscountType === 'percentage' 
                    ? `${billDiscount}%` 
                    : `PKR ${billDiscountByPrice}`
                  }):
                </span>
                <span>-LKR {billDiscountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-gray-700 pt-2 flex justify-between text-green-400 font-bold text-2xl">
              <span>TOTAL:</span>
              <span>LKR {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Virtual Keyboard */}
          <VirtualKeyboard
            isCartMode={selectedCartIndex !== null}
            isDiscountMode={discountMode !== null}
            discountModeType={discountMode}
            onKeyPress={(key) => {
              if (discountMode) {
                // In discount mode, only accept numbers
                if (!isNaN(key)) {
                  setDiscountInputValue(prev => prev + key)
                }
              } else if (selectedCartIndex !== null) {
                // Type into whichever cart field is active
                if (cartEditField === 'discount') {
                  setCartInputDiscount(prev => prev + key)
                } else {
                  setCartInputQty(prev => prev + key)
                }
              } else {
                setProductId(prev => prev + key)
                setProductSearch(prev => prev + key)
              }
            }}
            onDelete={() => {
              if (discountMode) {
                setDiscountInputValue(prev => prev.slice(0, -1))
              } else if (selectedCartIndex !== null) {
                if (cartEditField === 'discount') {
                  setCartInputDiscount(prev => prev.slice(0, -1))
                } else {
                  setCartInputQty(prev => prev.slice(0, -1))
                }
              } else {
                setProductId(prev => prev.slice(0, -1))
                setProductSearch(prev => prev.slice(0, -1))
              }
            }}
            onClear={() => {
              if (discountMode) {
                setDiscountInputValue('')
              } else if (selectedCartIndex !== null) {
                if (cartEditField === 'discount') {
                  setCartInputDiscount('')
                } else {
                  setCartInputQty('')
                }
              } else {
                setProductId('')
                setProductSearch('')
              }
            }}
            onClearCart={clearCart}
            onAdd={() => {
              if (discountMode) {
                // Apply bill discount (item discounts are set per cart line)
                const discountValue = parseFloat(discountInputValue) || 0
                setBillDiscount(discountValue.toString())
                toast({
                  title: "Bill Discount Applied",
                  description: `${discountValue}% discount set`,
                  duration: 800
                })
                setDiscountMode(null)
                setDiscountInputValue('')
              } else if (selectedCartIndex !== null) {
                commitCartEdit()
              } else {
                addToCart()
              }
            }}
            onEnter={() => {
              if (discountMode) {
                // Apply bill discount and close
                const discountValue = parseFloat(discountInputValue) || 0
                setBillDiscount(discountValue.toString())
                setDiscountMode(null)
                setDiscountInputValue('')
              } else if (selectedCartIndex !== null) {
                commitCartEdit()
              } else if (cart.length > 0) {
                initiatePayment()
              }
            }}
          />

          {/* Status Bar - Show selected item or ready to checkout */}
          <div className="bg-black border-t-2 border-gray-700 p-2">
            {selectedCartIndex !== null ? (
              <div className="text-center space-y-1 py-1">
                <div className="text-yellow-400 font-bold text-base">EDIT ITEM MODE ({cartEditField === 'discount' ? 'DISCOUNT %' : 'QTY'})</div>
                <div className="text-xs text-yellow-300">Tap a field to switch • Press ADD or ENT to apply</div>
              </div>
            ) : cart.length > 0 ? (
              <div className="text-center space-y-1 py-1">
                <div className="text-green-400 font-bold text-base">READY TO PAY</div>
                <div className="text-xs text-green-300">Click item to edit qty & discount • Press ENT to complete</div>
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
        billDiscountType={billDiscountType}
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
          billDiscountType={billDiscountType}
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

      {/* Product Quantity Modal */}
      <ProductQuantityModal
        isOpen={showProductQuantityModal}
        onClose={() => {
          setShowProductQuantityModal(false)
          setSelectedProductForQuantity(null)
        }}
        product={selectedProductForQuantity}
        onAddToCart={handleQuantityModalAddToCart}
        productPrice={selectedProductForQuantity ? getProductPrice(selectedProductForQuantity) : 0}
      />

      {/* Create Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-950 rounded-lg max-w-2xl w-full mx-4">
            <CustomerFormModal
              onSuccess={() => {
                setShowCustomerModal(false)
                toast({
                  title: "Success",
                  description: "Customer created successfully",
                })
              }}
              onCancel={() => setShowCustomerModal(false)}
            />
          </div>
        </div>
      )}

      {/* Returns Modal */}
      <POSReturnModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        onSuccess={handleReturnSuccess}
      />

      {/* Insufficient Stock Warning Modal */}
      <InsufficientStockWarning
        isOpen={showStockWarning}
        onClose={() => {
          setShowStockWarning(false)
          setStockWarningData(null)
          closeCartEdit()
        }}
        onConfirm={handleStockWarningConfirm}
        productName={stockWarningData?.productName}
        availableQuantity={stockWarningData?.availableQuantity}
        requestedQuantity={stockWarningData?.requestedQuantity}
        currentCartQuantity={stockWarningData?.currentCartQuantity}
      />
    </div>
  )
}
