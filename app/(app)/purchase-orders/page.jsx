"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import PurchaseOrdersTable from "@/components/purchase-orders-table"
import { useToast } from "@/hooks/use-toast"

export default function PurchaseOrdersPage() {
  const [suppliers, setSuppliers] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch suppliers for dropdown
      const suppliersRes = await fetch(`/api/suppliers?limit=1000`)
      if (suppliersRes.ok) {
        const suppliersData = await suppliersRes.json()
        setSuppliers(suppliersData.suppliers || [])
      } else {
        console.error("Failed to fetch suppliers:", suppliersRes.status)
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error)
    }

    try {
      // Fetch purchase orders
      const posRes = await fetch(`/api/purchase-orders?limit=1000`)
      if (posRes.ok) {
        const posData = await posRes.json()
        setPurchaseOrders(posData.purchase_orders || [])
      } else {
        console.error("Failed to fetch purchase orders:", posRes.status)
      }
    } catch (error) {
      console.error("Error fetching purchase orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const pendingOrders = purchaseOrders.filter(po => po.status === 'pending').length
  const partialOrders = purchaseOrders.filter(po => po.status === 'partial').length
  const receivedOrders = purchaseOrders.filter(po => po.status === 'received').length
  const totalValue = purchaseOrders.reduce((sum, po) => sum + (po.total_amount || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground mt-2">Create and manage purchase orders from suppliers</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{purchaseOrders.length}</p>
              <p className="text-sm text-muted-foreground">Total Orders</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{pendingOrders}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{partialOrders}</p>
              <p className="text-sm text-muted-foreground">Partial</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{receivedOrders}</p>
              <p className="text-sm text-muted-foreground">Received</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Order Value</p>
              <p className="text-3xl font-bold">${totalValue.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Average Order Value</p>
              <p className="text-3xl font-bold">
                ${purchaseOrders.length > 0 ? (totalValue / purchaseOrders.length).toFixed(2) : "0.00"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Orders Table */}
      <PurchaseOrdersTable initialSuppliers={suppliers} />
    </div>
  )
}
