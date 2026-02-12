"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Check, Minus, Plus } from "lucide-react"

export default function ProductQuantityModal({
  isOpen,
  onClose,
  product,
  onAddToCart,
  productPrice
}) {
  const [variations, setVariations] = useState([])
  const [selectedVariation, setSelectedVariation] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showNumpad, setShowNumpad] = useState(false)
  const [numpadValue, setNumpadValue] = useState('')

  useEffect(() => {
    if (isOpen && product) {
      // Reset variations state immediately when opening modal
      setVariations([])
      setSelectedVariation(null)
      setQuantity(1) // Reset quantity when modal opens
      setShowNumpad(false) // Reset numpad state
      setNumpadValue('') // Reset numpad value
      fetchVariations()
    }
  }, [isOpen, product])

  // Keyboard controls
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault()
          incrementQuantity()
          break
        case 'ArrowDown':
          event.preventDefault()
          decrementQuantity()
          break
        case 'Enter':
          event.preventDefault()
          if (quantity >= 0.1) {
            handleConfirm()
          }
          break
        case 'Escape':
          event.preventDefault()
          handleClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, quantity])

  const fetchVariations = async () => {
    if (!product?.id) return

    setLoading(true)
    try {
      const res = await fetch(`/api/products/${product.id}/price-variations/active`)
      if (res.ok) {
        const data = await res.json()
        const activeVariations = data.variations || []
        setVariations(activeVariations)

        // Pre-select base price by default, or default variation if specified
        const defaultVar = activeVariations.find(v => v.is_default)
        if (defaultVar) {
          setSelectedVariation(defaultVar)
        } else {
          setSelectedVariation(null) // Default to base price
        }
      }
    } catch (error) {
      console.error('Failed to fetch price variations:', error)
      setSelectedVariation(null)
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = (value) => {
    const numValue = parseFloat(value) || 0.1
    if (numValue > 0 && numValue <= (product?.available_quantity || 999999)) {
      setQuantity(numValue)
    }
  }

  const incrementQuantity = () => {
    if (quantity < (product?.available_quantity || 999999)) {
      setQuantity(prev => prev + 1)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 0.1) {
      setQuantity(prev => Math.max(0.1, prev - 1))
    }
  }

  const handleConfirm = () => {
    if (product) {
      onAddToCart(product, selectedVariation, quantity)
      onClose()
    }
  }

  const handleClose = () => {
    setSelectedVariation(null)
    setQuantity(1)
    setShowNumpad(false)
    setNumpadValue('')
    onClose()
  }

  // Numpad handlers
  const handleNumpadClick = (value) => {
    if (value === 'C') {
      setNumpadValue('')
      setQuantity(1)
    } else if (value === '.') {
      if (!numpadValue.includes('.')) {
        setNumpadValue(prev => prev + '.')
      }
    } else {
      const newValue = numpadValue + value
      setNumpadValue(newValue)
      const numValue = parseFloat(newValue) || 0
      if (numValue > 0 && numValue <= (product?.available_quantity || 999999)) {
        setQuantity(numValue)
      }
    }
  }

  const handleInputFocus = () => {
    setShowNumpad(true)
    setNumpadValue(quantity.toString())
  }

  const handlePopupClick = (e) => {
    // Hide numpad when clicking anywhere in the popup except the input
    if (!e.target.closest('#quantity') && !e.target.closest('.numpad-container')) {
      setShowNumpad(false)
    }
  }

  const hasVariations = variations.length > 0
  const selectedPrice = selectedVariation ? selectedVariation.price : productPrice
  const totalPrice = selectedPrice * quantity

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`${showNumpad ? 'max-w-4xl' : 'max-w-md'} transition-all duration-200`} onClick={handlePopupClick}>
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M18 6l-12 12M6 6l12 12"></path>
          </svg>
          <span className="sr-only">Close</span>
        </button>
        <div className="flex">
          {/* Main Content */}
          <div className="flex-1 min-w-[400px]">
            <DialogHeader className="pr-8">
              <DialogTitle>Add to Cart</DialogTitle>
              <DialogDescription>
                {product?.name}
              </DialogDescription>
            </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quantity Input */}
          <div className="space-y-3">
            <Label htmlFor="quantity" className="text-base font-semibold">Quantity</Label>
            <div className="flex items-center justify-center space-x-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={decrementQuantity}
                disabled={quantity <= 0.1}
                className="h-14 w-14 text-xl font-bold"
              >
                <Minus className="h-7 w-7" />
              </Button>
              <Input
                id="quantity"
                type="number"
                min="0.1"
                max={product?.available_quantity || 999999}
                step="0.1"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                onFocus={handleInputFocus}
                className="text-center w-24 h-12 text-lg font-bold"
              />
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={incrementQuantity}
                disabled={quantity >= (product?.available_quantity || 999999)}
                className="h-14 w-14 text-xl font-bold"
              >
                <Plus className="h-7 w-7" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground text-center">
              Available: {product?.available_quantity || 0} units
            </div>
          </div>

          {/* Price Variations */}
          {hasVariations && (
            <div className="space-y-2">
              <Label>Price Options</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {/* Base Product Price Option */}
                <div
                  onClick={() => setSelectedVariation(null)}
                  className={`
                    relative border-2 rounded-lg p-3 cursor-pointer transition-all
                    ${selectedVariation === null
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/50'}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold">
                        Standard Price
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Base
                        </Badge>
                      </div>
                      <div className="text-lg font-bold text-primary">
                        LKR {productPrice.toFixed(2)}
                      </div>
                    </div>
                    {selectedVariation === null && (
                      <div className="ml-2">
                        <div className="bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Variation Options */}
                {variations.map((variation) => (
                  <div
                    key={variation.id}
                    onClick={() => setSelectedVariation(variation)}
                    className={`
                      relative border-2 rounded-lg p-3 cursor-pointer transition-all
                      ${selectedVariation?.id === variation.id
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/50'}
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold">
                          {variation.variant_name}
                          {variation.is_default && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        <div className="text-lg font-bold text-primary">
                          LKR {parseFloat(variation.price).toFixed(2)}
                        </div>
                        {variation.description && (
                          <div className="text-sm text-muted-foreground">
                            {variation.description}
                          </div>
                        )}
                      </div>
                      {selectedVariation?.id === variation.id && (
                        <div className="ml-2">
                          <div className="bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total:</span>
              <span className="text-xl font-bold text-primary">
                LKR {totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={quantity < 0.1}
              >
                Add to Cart
              </Button>
            </DialogFooter>
          </div>

          {/* Numpad - only shown when input is focused */}
          {showNumpad && (
            <div className="numpad-container border-l border-gray-700 pl-4 ml-4 flex flex-col justify-center min-w-[200px]">
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '.'].map((key, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleNumpadClick(key)}
                    className="h-14 w-14 border-2 border-gray-600 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold text-xl transition-colors"
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}