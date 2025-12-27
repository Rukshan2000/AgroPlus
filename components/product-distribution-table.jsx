"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Pencil, Trash2, Plus, Search, Truck, Calendar } from "lucide-react"
import DistributeProductModal from "./distribute-product-modal"
import { useCsrf } from "@/hooks/use-csrf"

export default function ProductDistributionTable({ initialDistributions = [], products = [], outlets = [] }) {
  const { csrfToken } = useCsrf()
  const [distributions, setDistributions] = useState(initialDistributions)
  const [search, setSearch] = useState("")
  const [filterOutlet, setFilterOutlet] = useState("all")
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDistribution, setEditingDistribution] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit] = useState(10)

  // Fetch distributions on component mount
  useEffect(() => {
    fetchDistributions()
  }, [search, filterOutlet, currentPage])

  async function fetchDistributions() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: limit,
      })

      if (filterOutlet !== "all") {
        params.append("outlet_id", filterOutlet)
      }

      const res = await fetch(`/api/product-distribute?${params}`)
      if (res.ok) {
        const data = await res.json()
        setDistributions(data.distributions || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error("Error fetching distributions:", error)
    } finally {
      setLoading(false)
    }
  }

  function handleAddClick() {
    setEditingDistribution(null)
    setIsModalOpen(true)
  }

  function handleEditClick(distribution) {
    setEditingDistribution(distribution)
    setIsModalOpen(true)
  }

  function handleModalClose() {
    setIsModalOpen(false)
    setEditingDistribution(null)
  }

  async function handleModalSuccess() {
    await fetchDistributions()
  }

  function handleDeleteClick(distribution) {
    setDeleteConfirm(distribution)
  }

  async function handleDeleteConfirm() {
    if (!deleteConfirm) return
    
    if (!csrfToken) {
      console.error("CSRF token not available")
      return
    }

    try {
      const res = await fetch(
        `/api/product-distribute?id=${deleteConfirm.id}`,
        {
          method: "DELETE",
          headers: {
            "x-csrf-token": csrfToken,
          },
        }
      )

      if (res.ok) {
        await fetchDistributions()
      }
    } catch (error) {
      console.error("Error deleting distribution:", error)
    } finally {
      setDeleteConfirm(null)
    }
  }

  const filteredDistributions = distributions.filter(dist => {
    const matchesSearch = !search || 
      dist.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      dist.outlet_name?.toLowerCase().includes(search.toLowerCase()) ||
      dist.sku?.toLowerCase().includes(search.toLowerCase())
    return matchesSearch
  })

  const pages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Product Distribution</CardTitle>
          </div>
          <Button onClick={handleAddClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Distribute Product
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter Section */}
          <div className="flex gap-4 flex-col sm:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by product name, SKU, or outlet..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filterOutlet} onValueChange={setFilterOutlet}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by outlet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outlets</SelectItem>
                {outlets.map(outlet => (
                  <SelectItem key={outlet.id} value={outlet.id.toString()}>
                    {outlet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table Section */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Outlet</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Distributed By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan="7" className="text-center py-4">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredDistributions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan="7" className="text-center py-4 text-muted-foreground">
                      No distributions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDistributions.map(distribution => (
                    <TableRow key={distribution.id}>
                      <TableCell className="font-medium">
                        {distribution.product_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{distribution.sku}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{distribution.outlet_name}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">{distribution.quantity_distributed}</div>
                        {distribution.notes && (
                          <div className="text-xs text-muted-foreground mt-1">{distribution.notes}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{distribution.distributed_by}</TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(distribution.distribution_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(distribution)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(distribution)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {pages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(pages, prev + 1))}
                  disabled={currentPage === pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribution Modal */}
      <DistributeProductModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        products={products}
        outlets={outlets}
        onSuccess={handleModalSuccess}
        editingDistribution={editingDistribution}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Distribution</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this distribution record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600">
            Delete
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
