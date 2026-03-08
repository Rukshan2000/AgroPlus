"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCsrf } from "@/hooks/use-csrf"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function BulkDistributeModal({ 
  isOpen, 
  onClose, 
  products, 
  outlets,
  onSuccess
}) {
  const { csrfToken } = useCsrf()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    selected_product_ids: [],
    outlet_id: "",
    notes: "",
  })

  const availableProducts = products
  const selectedProductIds = formData.selected_product_ids
  const selectedProducts = availableProducts.filter(p => selectedProductIds.includes(p.id))
  const allProductsSelected = availableProducts.length > 0 && selectedProductIds.length === availableProducts.length

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError(null)
    setSuccess(false)
  }

  const handleProductToggle = (productId) => {
    setFormData(prev => ({
      ...prev,
      selected_product_ids: prev.selected_product_ids.includes(productId)
        ? prev.selected_product_ids.filter(id => id !== productId)
        : [...prev.selected_product_ids, productId]
    }))
    setError(null)
    setSuccess(false)
  }

  const handleSelectAll = () => {
    if (allProductsSelected) {
      handleChange("selected_product_ids", [])
    } else {
      handleChange("selected_product_ids", availableProducts.map(p => p.id))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    
    if (!csrfToken) {
      setError("Security token not loaded. Please refresh and try again.")
      return
    }

    if (selectedProductIds.length === 0 || !formData.outlet_id) {
      setError("Please select at least one product and an outlet")
      return
    }

    setLoading(true)

    try {
      let successCount = 0
      let failureCount = 0
      let failedProducts = []
      let errorMessages = []

      // Distribute each selected product to the outlet
      for (const productId of selectedProductIds) {
        const product = products.find(p => p.id === productId)
        if (!product) continue

        try {
          const res = await fetch("/api/product-distribute", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-csrf-token": csrfToken,
            },
            body: JSON.stringify({
              product_id: parseInt(productId),
              outlet_id: parseInt(formData.outlet_id),
              quantity_distributed: parseFloat(product.stock_quantity),
              notes: formData.notes.trim() || "",
            }),
          })

          if (res.ok) {
            successCount++
          } else {
            failureCount++
            failedProducts.push(product.name)
            const errorData = await res.json()
            console.error(`Failed to distribute ${product.name}:`, errorData)
            
            // Log detailed validation errors
            if (errorData.details && Array.isArray(errorData.details)) {
              console.error(`Validation details for ${product.name}:`, errorData.details)
            }
            
            const errorMsg = errorData.details?.[0]?.message || errorData.error || "Unknown error"
            if (!errorMessages.includes(errorMsg)) {
              errorMessages.push(errorMsg)
            }
          }
        } catch (err) {
          failureCount++
          failedProducts.push(product.name)
          console.error(`Error distributing ${product.name}:`, err)
        }

        // Add small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      if (failureCount === 0) {
        setSuccess(true)
        setFormData({
          selected_product_ids: [],
          outlet_id: "",
          notes: "",
        })
        setTimeout(() => {
          onClose()
          onSuccess?.()
        }, 1500)
      } else if (successCount > 0) {
        const mainError = errorMessages.length > 0 ? errorMessages[0] : `Failed to distribute some products`
        setError(`${mainError} | Distributed ${successCount}/${selectedProductIds.length} products successfully`)
      } else {
        const mainError = errorMessages.length > 0 ? errorMessages[0] : `Failed to distribute products`
        setError(`${mainError} (Check browser console for detailed validation errors)`)
        console.error("All products failed. Error details:", errorMessages)
      }
    } catch (err) {
      console.error("Error:", err)
      setError("An error occurred while processing the distribution")
    } finally {
      setLoading(false)
    }
  }

  const getSelectedOutlet = () => {
    if (!formData.outlet_id) return null
    return outlets.find(o => o.id === parseInt(formData.outlet_id))
  }

  const selectedOutlet = getSelectedOutlet()
  const totalQtyToDistribute = selectedProducts.reduce((sum, p) => sum + (parseFloat(p.stock_quantity) || 0), 0)

  const handleClose = () => {
    if (!loading) {
      setFormData({
        selected_product_ids: [],
        outlet_id: "",
        notes: "",
      })
      setError(null)
      setSuccess(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bulk Distribute Products</DialogTitle>
          <DialogDescription>
            Select products and an outlet to distribute all available quantities
          </DialogDescription>
        </DialogHeader>

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Distribution completed successfully!
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Products Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">Products to Distribute</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {availableProducts.length} products available
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={loading || success || availableProducts.length === 0}
              >
                {allProductsSelected ? "Clear All" : "Select All"}
              </Button>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No products found
              </div>
            ) : (
              <ScrollArea className="border rounded-md h-64 p-4">
                <div className="space-y-3">
                  {availableProducts.map(product => (
                    <div key={product.id} className="flex items-center space-x-3 pr-4">
                      <Checkbox
                        id={`product-${product.id}`}
                        checked={selectedProductIds.includes(product.id)}
                        onCheckedChange={() => handleProductToggle(product.id)}
                        disabled={loading || success}
                      />
                      <label
                        htmlFor={`product-${product.id}`}
                        className="flex-1 cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.sku}</p>
                        </div>
                        <span className="text-sm font-semibold text-blue-600 ml-4">
                          Stock: {product.stock_quantity}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Selected Products Summary */}
          {selectedProducts.length > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Selected Products</p>
                    <p className="font-semibold text-lg text-blue-600">{selectedProducts.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Quantity</p>
                    <p className="font-semibold text-lg text-blue-600">{totalQtyToDistribute.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Destination</p>
                    <p className="font-semibold text-lg text-blue-600">{selectedOutlet?.name || "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Outlet Selection */}
          <div className="space-y-2">
            <Label htmlFor="outlet">Destination Outlet</Label>
            <Select 
              value={formData.outlet_id} 
              onValueChange={(value) => handleChange("outlet_id", value)}
              disabled={loading || success}
            >
              <SelectTrigger id="outlet">
                <SelectValue placeholder="Select an outlet" />
              </SelectTrigger>
              <SelectContent>
                {outlets.map(outlet => (
                  <SelectItem key={outlet.id} value={outlet.id.toString()}>
                    {outlet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this bulk distribution..."
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              disabled={loading || success}
              className="resize-none"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || success || selectedProductIds.length === 0 || !formData.outlet_id}
            >
              {loading ? "Distributing..." : `Distribute ${selectedProducts.length} Product(s)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
