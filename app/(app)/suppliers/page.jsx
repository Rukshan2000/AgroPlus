"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import SuppliersTable from "@/components/suppliers-table"
import { useToast } from "@/hooks/use-toast"

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/suppliers?limit=100`)
      if (!response.ok) throw new Error("Failed to fetch suppliers")
      const data = await response.json()
      setSuppliers(data.suppliers)
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Failed to load suppliers",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Supplier Management</h1>
          <p className="text-muted-foreground mt-2">Manage suppliers and track supplier information</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{suppliers.length}</p>
              <p className="text-sm text-muted-foreground">Total Suppliers</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">
                {suppliers.filter(s => s.is_active).length}
              </p>
              <p className="text-sm text-muted-foreground">Active Suppliers</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">
                {suppliers.filter(s => s.supplier_type === 'manufacturer').length}
              </p>
              <p className="text-sm text-muted-foreground">Manufacturers</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">
                {suppliers.filter(s => s.supplier_type === 'distributor').length}
              </p>
              <p className="text-sm text-muted-foreground">Distributors</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers Table */}
      <SuppliersTable initialSuppliers={suppliers} />
    </div>
  )
}
