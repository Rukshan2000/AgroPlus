"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, Trash2, Plus, Search, MapPin } from "lucide-react"
import AddOutletModal from "./add-outlet-modal"
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

export default function OutletsTable({ initialOutlets = [] }) {
  const [outlets, setOutlets] = useState(initialOutlets)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingOutlet, setEditingOutlet] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit] = useState(10)
  
  // Fetch outlets on component mount
  useEffect(() => {
    fetchOutlets()
  }, [search, statusFilter, currentPage])

  async function fetchOutlets() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', currentPage)
      params.append('limit', limit)
      
      if (search) {
        params.append('search', search)
      }
      
      if (statusFilter !== "all") {
        params.append('is_active', statusFilter === "active" ? "true" : "false")
      }

      const res = await fetch(`/api/outlets?${params}`)
      if (res.ok) {
        const data = await res.json()
        setOutlets(data.outlets || [])
        setTotal(data.total || 0)
      } else {
        console.error('Failed to fetch outlets:', res.status)
      }
    } catch (error) {
      console.error('Error fetching outlets:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleAddClick() {
    setEditingOutlet(null)
    setIsModalOpen(true)
  }

  function handleEditClick(outlet) {
    setEditingOutlet(outlet)
    setIsModalOpen(true)
  }

  function handleModalClose() {
    setIsModalOpen(false)
    setEditingOutlet(null)
  }

  async function handleModalSuccess(outlet, action) {
    await fetchOutlets()
    
    // Show success message
    const message = action === 'created' ? 'Outlet created successfully' : 'Outlet updated successfully'
    console.log(message)
  }

  function handleDeleteClick(outlet) {
    setDeleteConfirm(outlet)
  }

  async function handleDeleteConfirm() {
    if (!deleteConfirm) return

    try {
      const csrf = await fetch("/api/auth/csrf")
        .then((r) => r.json())
        .then((d) => d.csrfToken)

      const res = await fetch(`/api/outlets`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrf
        },
        body: JSON.stringify({ id: deleteConfirm.id })
      })

      if (res.ok) {
        await fetchOutlets()
        setDeleteConfirm(null)
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || "Failed to delete outlet")
      }
    } catch (error) {
      alert("Failed to delete outlet")
    }
  }

  const pages = Math.ceil(total / limit)
  const visibleOutlets = loading ? [] : outlets

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Outlets Management
          </CardTitle>
          <Button onClick={handleAddClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Outlet
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search outlets..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value)
              setCurrentPage(1)
            }}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outlets</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleOutlets.length > 0 ? (
                  visibleOutlets.map((outlet) => (
                    <TableRow key={outlet.id}>
                      <TableCell className="font-medium">{outlet.name}</TableCell>
                      <TableCell>{outlet.location || "-"}</TableCell>
                      <TableCell>{outlet.phone || "-"}</TableCell>
                      <TableCell>{outlet.manager || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={outlet.is_active ? "default" : "secondary"}>
                          {outlet.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(outlet)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteClick(outlet)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="6" className="text-center py-8 text-muted-foreground">
                      {loading ? "Loading..." : "No outlets found"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {pages} ({total} total)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(pages, p + 1))}
                  disabled={currentPage === pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddOutletModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        outlet={editingOutlet}
      />

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => {
        if (!open) setDeleteConfirm(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Outlet?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <strong>Outlet Details:</strong><br />
              Name: {deleteConfirm?.name}<br />
              Location: {deleteConfirm?.location || "N/A"}
            </p>
          </div>
          <div className="flex gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
