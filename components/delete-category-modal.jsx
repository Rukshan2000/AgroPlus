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
import { Trash2, AlertTriangle } from "lucide-react"

export default function DeleteCategoryModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  category = null 
}) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!category) return

    setLoading(true)
    try {
      const csrf = await fetch("/api/auth/csrf")
        .then((r) => r.json())
        .then((d) => d.csrfToken)
      
      const res = await fetch(`/api/categories/${category.id}`, {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json", 
          "x-csrf-token": csrf 
        },
      })

      if (res.ok) {
        onSuccess(category.id)
        onClose()
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || "Failed to delete category")
      }
    } catch (error) {
      alert("Failed to delete category")
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
            Delete Category
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "<strong>{category?.name}</strong>"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="space-y-2 text-sm">
              <div><strong>Name:</strong> {category?.name}</div>
              {category?.description && (
                <div><strong>Description:</strong> {category.description}</div>
              )}
              {category?.color && (
                <div className="flex items-center gap-2">
                  <strong>Color:</strong> 
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  {category.color}
                </div>
              )}
              <div><strong>Status:</strong> {category?.is_active ? "Active" : "Inactive"}</div>
              {category?.usage_count !== undefined && (
                <div className="flex items-center gap-2">
                  <strong>Products using this category:</strong> 
                  <span className={category.usage_count > 0 ? "text-orange-600 font-medium" : "text-green-600"}>
                    {category.usage_count}
                  </span>
                </div>
              )}
            </div>
            
            {category?.usage_count > 0 && (
              <div className="flex items-start gap-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Warning:</strong> This category is currently being used by {category.usage_count} product(s). 
                  Deleting it may affect those products.
                </div>
              </div>
            )}
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
            {loading ? "Deleting..." : "Delete Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
