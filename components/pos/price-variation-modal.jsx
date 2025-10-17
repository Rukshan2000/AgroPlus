"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

export default function PriceVariationModal({ 
  isOpen, 
  onClose, 
  product,
  onVariationSelect
}) {
  const [variations, setVariations] = useState([])
  const [selectedVariation, setSelectedVariation] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && product) {
      fetchVariations()
    }
  }, [isOpen, product])

  const fetchVariations = async () => {
    if (!product?.id) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/products/${product.id}/price-variations/active`)
      if (res.ok) {
        const data = await res.json()
        const activeVariations = data.variations || []
        setVariations(activeVariations)
        
        // Pre-select default variation if available
        const defaultVar = activeVariations.find(v => v.is_default)
        if (defaultVar) {
          setSelectedVariation(defaultVar)
        } else if (activeVariations.length > 0) {
          setSelectedVariation(activeVariations[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch price variations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    if (selectedVariation) {
      onVariationSelect(selectedVariation)
      onClose()
    }
  }

  const handleClose = () => {
    setSelectedVariation(null)
    onClose()
  }

  // If no variations available, use default product price
  const hasVariations = variations.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Price Option</DialogTitle>
          <DialogDescription>
            {product?.name} - Choose a price variation
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading price options...
            </div>
          ) : !hasVariations ? (
            <div className="text-center py-8 text-muted-foreground">
              No price variations available. Using default product price.
            </div>
          ) : (
            <div className="space-y-2">
              {variations.map((variation) => (
                <div
                  key={variation.id}
                  onClick={() => setSelectedVariation(variation)}
                  className={`
                    relative border-2 rounded-lg p-4 cursor-pointer transition-all
                    ${selectedVariation?.id === variation.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-lg">
                        {variation.variant_name}
                        {variation.is_default && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-primary mt-1">
                        LKR {parseFloat(variation.price).toFixed(2)}
                      </div>
                      {variation.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {variation.description}
                        </div>
                      )}
                      {variation.stock_quantity > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Stock: {variation.stock_quantity} units
                        </div>
                      )}
                    </div>
                    {selectedVariation?.id === variation.id && (
                      <div className="ml-3">
                        <div className="bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-5 w-5" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
            disabled={!selectedVariation && hasVariations}
          >
            {hasVariations ? 'Select & Continue' : 'Use Default Price'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
