"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function PurchaseOrderDetailsModal({
  open,
  onOpenChange,
  purchaseOrderId,
  onRefresh
}) {
  const { toast } = useToast()
  const [po, setPO] = useState(null)
  const [loading, setLoading] = useState(false)
  const [receivingItems, setReceivingItems] = useState({})
  const [isReceiving, setIsReceiving] = useState(false)

  useEffect(() => {
    if (open && purchaseOrderId) {
      fetchDetails()
    }
  }, [open, purchaseOrderId])

  const fetchDetails = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/purchase-orders/${purchaseOrderId}`)
      if (!response.ok) throw new Error("Failed to fetch purchase order details")

      const data = await response.json()
      setPO(data)
      setReceivingItems({})
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Failed to load purchase order details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReceiveItem = (itemId, value) => {
    setReceivingItems(prev => ({
      ...prev,
      [itemId]: parseFloat(value) || 0
    }))
  }

  const handleSubmitReceipt = async () => {
    if (Object.values(receivingItems).every(v => v === 0)) {
      toast({
        title: "Error",
        description: "Please enter quantities to receive",
        variant: "destructive"
      })
      return
    }

    setIsReceiving(true)
    try {
      const csrfRes = await fetch("/api/auth/csrf")
      const csrfData = await csrfRes.json()
      const csrfToken = csrfData.csrfToken || csrfData.token

      const itemUpdates = po.items
        .filter(item => receivingItems[item.id] && receivingItems[item.id] > 0)
        .map(item => ({
          id: item.id,
          quantity_received: receivingItems[item.id]
        }))

      const response = await fetch(`/api/purchase-orders/${purchaseOrderId}?action=receive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        body: JSON.stringify(itemUpdates)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to receive items")
      }

      toast({
        title: "Success",
        description: "Items received successfully"
      })

      onOpenChange(false)
      if (onRefresh) onRefresh()
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsReceiving(false)
    }
  }

  if (!po) {
    return null
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      partial: "bg-blue-100 text-blue-800",
      received: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800"
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{po.order_number}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading...</div>
        ) : (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="items">Items</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4 space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Order Number</p>
                      <p className="font-semibold">{po.order_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Supplier</p>
                      <p className="font-semibold">{po.supplier_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge className={`${getStatusColor(po.status)} capitalize mt-1`}>
                        {po.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Order Date</p>
                      <p className="font-semibold">{new Date(po.order_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Expected Delivery</p>
                      <p className="font-semibold">
                        {po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : "-"}
                      </p>
                    </div>
                    {po.actual_delivery_date && (
                      <div>
                        <p className="text-sm text-gray-600">Actual Delivery</p>
                        <p className="font-semibold">{new Date(po.actual_delivery_date).toLocaleDateString()}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {po.contact_person && (
                <Card>
                  <CardContent className="pt-4 space-y-2">
                    <p className="font-semibold mb-3">Supplier Contact</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Contact Person</p>
                        <p className="font-medium">{po.contact_person}</p>
                      </div>
                      {po.supplier_email && (
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium text-blue-600">{po.supplier_email}</p>
                        </div>
                      )}
                      {po.supplier_phone && (
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-medium">{po.supplier_phone}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Amount</span>
                    <span className="text-2xl font-bold">${(po.total_amount || 0).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              {po.notes && (
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-600 mb-2">Notes</p>
                    <p className="text-gray-700">{po.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Items Tab */}
            <TabsContent value="items" className="space-y-4">
              {po.items && po.items.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {po.items.map(item => (
                      <Card key={item.id}>
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-5 gap-4 items-center">
                            <div>
                              <p className="text-sm text-gray-600">Product</p>
                              <p className="font-semibold">{item.product_name}</p>
                              <p className="text-xs text-gray-500">SKU: {item.product_sku}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-600">Ordered</p>
                              <p className="font-semibold">{item.quantity_ordered}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-600">Received</p>
                              <p className="font-semibold">{item.quantity_received || 0}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-600">Unit Cost</p>
                              <p className="font-semibold">${item.unit_cost.toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Line Total</p>
                              <p className="font-semibold">${(item.line_total || 0).toFixed(2)}</p>
                            </div>
                          </div>

                          {/* Receive section for pending items */}
                          {po.status !== "received" && po.status !== "cancelled" && item.quantity_received < item.quantity_ordered && (
                            <div className="mt-4 pt-4 border-t">
                              <Label className="text-sm">Receive Quantity</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                max={item.quantity_ordered - item.quantity_received}
                                value={receivingItems[item.id] || ""}
                                onChange={(e) => handleReceiveItem(item.id, e.target.value)}
                                placeholder={`Max: ${(item.quantity_ordered - item.quantity_received).toFixed(2)}`}
                                className="mt-1"
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {po.status !== "received" && po.status !== "cancelled" && Object.values(receivingItems).some(v => v > 0) && (
                    <DialogFooter>
                      <Button
                        onClick={handleSubmitReceipt}
                        disabled={isReceiving}
                        className="w-full"
                      >
                        {isReceiving ? "Processing..." : "Receive Items"}
                      </Button>
                    </DialogFooter>
                  )}
                </>
              ) : (
                <div className="py-8 text-center text-gray-500">No items in this order</div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
