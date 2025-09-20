"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog"
import { Trash2 } from "lucide-react"

export default function DeleteProductModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  product = null 
}) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!product) return

    setLoading(true)
    try {
      const csrf = await fetch("/api/auth/csrf")
        .then((r) => r.json())
        .then((d) => d.csrfToken)
      
      const res = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json", 
          "x-csrf-token": csrf 
        },
      })

      if (res.ok) {
        onSuccess(product.id)
        onClose()
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

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Product
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "<strong>{product?.name}</strong>"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="space-y-2 text-sm">
              <div><strong>Name:</strong> {product?.name}</div>
              {product?.sku && <div><strong>SKU:</strong> {product.sku}</div>}
              {product?.category && <div><strong>Category:</strong> {product.category}</div>}
              <div><strong>Price:</strong> ${product?.price}</div>
              <div><strong>Stock:</strong> {product?.stock_quantity}</div>
            </div>
          </div>
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
            variant="destructive"
            onClick={handleDelete} 
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
