"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

export default function SupplierDetailsModal({
  open,
  onOpenChange,
  supplierId
}) {
  const { toast } = useToast()
  const [supplier, setSupplier] = useState(null)
  const [stats, setStats] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && supplierId) {
      fetchDetails()
    }
  }, [open, supplierId])

  const fetchDetails = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/suppliers/${supplierId}`)
      if (!response.ok) throw new Error("Failed to fetch supplier details")

      const data = await response.json()
      setSupplier(data)
      setStats(data.stats)
      setProducts(data.products || [])
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Failed to load supplier details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (!supplier) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{supplier.name}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading...</div>
        ) : (
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Information</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
            </TabsList>

            {/* Information Tab */}
            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4 space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge variant={supplier.is_active ? "default" : "secondary"}>
                        {supplier.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-medium capitalize">{supplier.supplier_type || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Rating</p>
                      <p className="font-medium">{supplier.rating ? `${supplier.rating}/5.0` : "N/A"}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Contact Person</p>
                      <p className="font-medium">{supplier.contact_person || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-blue-600">{supplier.email || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{supplier.phone || "N/A"}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium">
                      {supplier.address ? `${supplier.address}, ${supplier.city || ""} ${supplier.postal_code || ""}` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Country</p>
                    <p className="font-medium">{supplier.country || "N/A"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Payment Terms</p>
                    <p className="font-medium">{supplier.payment_terms || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-medium capitalize">{supplier.payment_method?.replace(/_/g, " ") || "N/A"}</p>
                  </div>
                  {supplier.bank_name && (
                    <div>
                      <p className="text-sm text-gray-600">Bank Details</p>
                      <p className="font-medium">{supplier.bank_name} - {supplier.bank_account}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {supplier.notes && (
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-600 mb-2">Notes</p>
                    <p className="text-gray-700">{supplier.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="stats" className="space-y-4">
              {stats ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold">{stats.total_orders || 0}</p>
                      <p className="text-sm text-gray-600">Total Orders</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold">{stats.pending_orders || 0}</p>
                      <p className="text-sm text-gray-600">Pending</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold">{stats.partial_orders || 0}</p>
                      <p className="text-sm text-gray-600">Partial</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold">${(stats.total_spent || 0).toFixed(2)}</p>
                      <p className="text-sm text-gray-600">Total Spent</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold">${(stats.avg_order_amount || 0).toFixed(2)}</p>
                      <p className="text-sm text-gray-600">Avg Order</p>
                    </CardContent>
                  </Card>

                  {stats.last_delivery_date && (
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <p className="text-sm font-semibold">{new Date(stats.last_delivery_date).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-600">Last Delivery</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">No statistics available</div>
              )}
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products">
              {products.length > 0 ? (
                <div className="space-y-2">
                  {products.map(product => (
                    <Card key={product.id}>
                      <CardContent className="pt-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${product.unit_cost}</p>
                          {product.minimum_order_quantity && (
                            <p className="text-sm text-gray-600">Min: {product.minimum_order_quantity}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">No products from this supplier</div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
