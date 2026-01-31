"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AddPurchaseOrderModal({
  open,
  onOpenChange,
  suppliers = [],
  onSuccess
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [orderNumber, setOrderNumber] = useState("")
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0])
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState([{ product_id: "", quantity_ordered: 1, unit_cost: 0 }])

  useEffect(() => {
    if (open) {
      fetchProducts()
      generateOrderNumber()
    }
  }, [open])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products?limit=1000")
      if (!response.ok) throw new Error("Failed to fetch products")
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      })
    }
  }

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString().slice(-6)
    setOrderNumber(`PO-${new Date().getFullYear()}-${timestamp}`)
  }

  const handleAddItem = () => {
    setItems([...items, { product_id: "", quantity_ordered: 1, unit_cost: 0 }])
  }

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...items]
    newItems[index][field] = field === "product_id" ? value : parseFloat(value) || value
    setItems(newItems)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedSupplier) {
      toast({
        title: "Error",
        description: "Please select a supplier",
        variant: "destructive"
      })
      return
    }

    if (items.some(item => !item.product_id || item.quantity_ordered <= 0 || item.unit_cost <= 0)) {
      toast({
        title: "Error",
        description: "Please fill all item details with valid values",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const csrfRes = await fetch("/api/auth/csrf")
      const csrfData = await csrfRes.json()
      const csrfToken = csrfData.csrfToken || csrfData.token

      const response = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        body: JSON.stringify({
          order_number: orderNumber,
          supplier_id: parseInt(selectedSupplier),
          order_date: orderDate,
          expected_delivery_date: expectedDeliveryDate,
          items: items.map(item => ({
            product_id: parseInt(item.product_id),
            quantity_ordered: parseFloat(item.quantity_ordered),
            unit_cost: parseFloat(item.unit_cost)
          })),
          notes
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create purchase order")
      }

      const data = await response.json()
      toast({
        title: "Success",
        description: "Purchase order created successfully"
      })
      onOpenChange(false)
      onSuccess(data)
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="orderNumber">Order Number</Label>
              <Input
                id="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="supplier">Supplier *</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="orderDate">Order Date</Label>
              <Input
                id="orderDate"
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="expectedDeliveryDate">Expected Delivery Date</Label>
              <Input
                id="expectedDeliveryDate"
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <Label>Order Items *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-5">
                        <Label className="text-xs">Product</Label>
                        <Select
                          value={item.product_id.toString()}
                          onValueChange={(value) => handleItemChange(index, "product_id", value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(product => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name} ({product.sku})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-2">
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity_ordered}
                          onChange={(e) => handleItemChange(index, "quantity_ordered", e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div className="col-span-3">
                        <Label className="text-xs">Unit Cost</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_cost}
                          onChange={(e) => handleItemChange(index, "unit_cost", e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div className="col-span-2 text-right">
                        <p className="text-sm font-semibold">
                          ${(item.quantity_ordered * item.unit_cost).toFixed(2)}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                          className="mt-2"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <div className="space-y-2">
                <div className="flex gap-4">
                  <span className="font-semibold">Order Total:</span>
                  <span className="font-bold text-lg">
                    ${items.reduce((sum, item) => sum + (item.quantity_ordered * item.unit_cost), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes for this order"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Purchase Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
