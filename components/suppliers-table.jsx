"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, Trash2, Plus, Search, Eye } from "lucide-react"
import AddSupplierModal from "./add-supplier-modal"
import DeleteSupplierModal from "./delete-supplier-modal"
import SupplierDetailsModal from "./supplier-details-modal"
import { useToast } from "@/hooks/use-toast"

export default function SuppliersTable({ initialSuppliers = [] }) {
  const [suppliers, setSuppliers] = useState(initialSuppliers)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (initialSuppliers && initialSuppliers.length > 0) {
      setSuppliers(initialSuppliers)
    } else {
      fetchSuppliers()
    }
  }, [])

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState(null)

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = !search ||
      supplier.name.toLowerCase().includes(search.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(search.toLowerCase()) ||
      supplier.phone?.toLowerCase().includes(search.toLowerCase()) ||
      supplier.city?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && supplier.is_active) ||
      (statusFilter === "inactive" && !supplier.is_active)

    const matchesType = typeFilter === "all" || supplier.supplier_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/suppliers?limit=100`)
      if (!response.ok) throw new Error("Failed to fetch suppliers")
      const data = await response.json()
      setSuppliers(data.suppliers)
    } catch (error) {
      console.error("Error fetching suppliers:", error)
      toast({
        title: "Error",
        description: "Failed to fetch suppliers",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (supplier) => {
    setSelectedSupplier(supplier)
    setEditModalOpen(true)
  }

  const handleDelete = (supplier) => {
    setSelectedSupplier(supplier)
    setDeleteModalOpen(true)
  }

  const handleDetails = (supplier) => {
    setSelectedSupplier(supplier)
    setDetailsModalOpen(true)
  }

  const handleAddSuccess = (newSupplier) => {
    setSuppliers([newSupplier, ...suppliers])
    setAddModalOpen(false)
    toast({
      title: "Success",
      description: "Supplier created successfully"
    })
  }

  const handleUpdateSuccess = (updatedSupplier) => {
    setSuppliers(suppliers.map(s => s.id === updatedSupplier.id ? updatedSupplier : s))
    setEditModalOpen(false)
    toast({
      title: "Success",
      description: "Supplier updated successfully"
    })
  }

  const handleDeleteSuccess = () => {
    setSuppliers(suppliers.filter(s => s.id !== selectedSupplier.id))
    setDeleteModalOpen(false)
    toast({
      title: "Success",
      description: "Supplier deleted successfully"
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Suppliers</CardTitle>
            <Button onClick={() => setAddModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Supplier
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search suppliers..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="wholesale">Wholesale</SelectItem>
                <SelectItem value="manufacturer">Manufacturer</SelectItem>
                <SelectItem value="distributor">Distributor</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Contact</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Phone</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Orders</th>
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
                ) : filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-gray-500">
                      No suppliers found
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map(supplier => (
                    <tr key={supplier.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{supplier.name}</td>
                      <td className="py-3 px-4 text-gray-600">{supplier.contact_person || "-"}</td>
                      <td className="py-3 px-4 text-gray-600">{supplier.email || "-"}</td>
                      <td className="py-3 px-4 text-gray-600">{supplier.phone || "-"}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="capitalize">
                          {supplier.supplier_type || "other"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={supplier.is_active ? "default" : "secondary"}>
                          {supplier.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {supplier.total_orders || 0}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDetails(supplier)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(supplier)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(supplier)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredSuppliers.length} of {suppliers.length} suppliers
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <AddSupplierModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSuccess={handleAddSuccess}
      />

      {selectedSupplier && (
        <>
          <AddSupplierModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            initialSupplier={selectedSupplier}
            isEdit={true}
            onSuccess={handleUpdateSuccess}
          />

          <DeleteSupplierModal
            open={deleteModalOpen}
            onOpenChange={setDeleteModalOpen}
            supplier={selectedSupplier}
            onSuccess={handleDeleteSuccess}
          />

          <SupplierDetailsModal
            open={detailsModalOpen}
            onOpenChange={setDetailsModalOpen}
            supplierId={selectedSupplier.id}
          />
        </>
      )}
    </div>
  )
}
