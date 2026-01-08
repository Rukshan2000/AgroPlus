"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, Trash2, Plus, Search, Eye, Package } from "lucide-react"
import AddPurchaseOrderModal from "./add-purchase-order-modal"
import DeletePurchaseOrderModal from "./delete-purchase-order-modal"
import PurchaseOrderDetailsModal from "./purchase-order-details-modal"
import { useToast } from "@/hooks/use-toast"

export default function PurchaseOrdersTable({ initialSuppliers = [] }) {
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [suppliers, setSuppliers] = useState(initialSuppliers)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [supplierFilter, setSupplierFilter] = useState("all")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedPO, setSelectedPO] = useState(null)

  useEffect(() => {
    if (initialSuppliers && initialSuppliers.length > 0) {
      setSuppliers(initialSuppliers)
    } else {
      fetchSuppliers()
    }
    fetchPurchaseOrders()
  }, [initialSuppliers])

  const fetchSuppliers = async () => {
    try {
      const response = await fetch(`/api/suppliers?limit=1000`)
      if (!response.ok) throw new Error("Failed to fetch suppliers")
      const data = await response.json()
      setSuppliers(data.suppliers || [])
    } catch (error) {
      console.error("Error fetching suppliers:", error)
    }
  }

  const fetchPurchaseOrders = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/purchase-orders?limit=100`)
      if (!response.ok) throw new Error("Failed to fetch purchase orders")
      const data = await response.json()
      setPurchaseOrders(data.purchase_orders)
    } catch (error) {
      console.error("Error fetching purchase orders:", error)
      toast({
        title: "Error",
        description: "Failed to fetch purchase orders",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = !search ||
      po.order_number.toLowerCase().includes(search.toLowerCase()) ||
      po.supplier_name?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === "all" || po.status === statusFilter

    const matchesSupplier = supplierFilter === "all" || po.supplier_id === parseInt(supplierFilter)

    return matchesSearch && matchesStatus && matchesSupplier
  })

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      partial: "bg-blue-100 text-blue-800",
      received: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800"
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const handleDelete = (po) => {
    setSelectedPO(po)
    setDeleteModalOpen(true)
  }

  const handleDetails = (po) => {
    setSelectedPO(po)
    setDetailsModalOpen(true)
  }

  const handleAddSuccess = (newPO) => {
    setPurchaseOrders([newPO, ...purchaseOrders])
    setAddModalOpen(false)
    toast({
      title: "Success",
      description: "Purchase order created successfully"
    })
  }

  const handleDeleteSuccess = () => {
    setPurchaseOrders(purchaseOrders.filter(po => po.id !== selectedPO.id))
    setDeleteModalOpen(false)
    toast({
      title: "Success",
      description: "Purchase order deleted successfully"
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Purchase Orders</CardTitle>
            <Button onClick={() => setAddModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Order
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by order # or supplier..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id.toString()}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4">Order Number</th>
                  <th className="text-left py-3 px-4">Supplier</th>
                  <th className="text-left py-3 px-4">Order Date</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Items</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Expected Delivery</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : filteredPOs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-gray-500">
                      No purchase orders found
                    </td>
                  </tr>
                ) : (
                  filteredPOs.map(po => (
                    <tr key={po.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{po.order_number}</td>
                      <td className="py-3 px-4 text-gray-600">{po.supplier_name}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(po.order_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-medium">${(po.total_amount || 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-gray-600">{po.item_count || 0}</td>
                      <td className="py-3 px-4">
                        <Badge className={`${getStatusColor(po.status)} capitalize`}>
                          {po.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : "-"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDetails(po)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {po.status !== "cancelled" && po.status !== "received" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(po)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredPOs.length} of {purchaseOrders.length} purchase orders
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <AddPurchaseOrderModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        suppliers={suppliers}
        onSuccess={handleAddSuccess}
      />

      {selectedPO && (
        <>
          <DeletePurchaseOrderModal
            open={deleteModalOpen}
            onOpenChange={setDeleteModalOpen}
            purchaseOrder={selectedPO}
            onSuccess={handleDeleteSuccess}
          />

          <PurchaseOrderDetailsModal
            open={detailsModalOpen}
            onOpenChange={setDetailsModalOpen}
            purchaseOrderId={selectedPO.id}
            onRefresh={fetchPurchaseOrders}
          />
        </>
      )}
    </div>
  )
}
