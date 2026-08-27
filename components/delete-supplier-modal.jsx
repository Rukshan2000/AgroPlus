"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function DeleteSupplierModal({
  open,
  onOpenChange,
  supplier,
  onSuccess
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const csrfRes = await fetch("/api/auth/csrf")
      const csrfData = await csrfRes.json()
      const csrfToken = csrfData.csrfToken || csrfData.token

      const response = await fetch(`/api/suppliers/${supplier.id}`, {
        method: "DELETE",
        headers: {
          "X-CSRF-Token": csrfToken
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete supplier")
      }

      toast({
        title: "Success",
        description: "Supplier deleted successfully"
      })

      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <DialogTitle>Delete Supplier</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete <strong>{supplier?.name}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
          <p className="font-semibold mb-2">Warning:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>All data associated with this supplier will be deleted</li>
            <li>This action cannot be reversed</li>
            <li>You cannot delete suppliers with active purchase orders</li>
          </ul>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete Supplier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
