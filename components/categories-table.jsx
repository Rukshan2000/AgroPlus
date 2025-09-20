"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, Trash2, Plus, Search, Tag } from "lucide-react"
import AddCategoryModal from "./add-category-modal"
import DeleteCategoryModal from "./delete-category-modal"

export default function CategoriesTable({ initialCategories = [] }) {
  const [categories, setCategories] = useState(initialCategories)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(false)
  
  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/categories')
        if (res.ok) {
          const data = await res.json()
          setCategories(data.categories || [])
        } else {
          console.error('Failed to fetch categories:', res.status)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])
  
  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)

  const filteredCategories = categories.filter(category => {
    const matchesSearch = !search || 
      category.name.toLowerCase().includes(search.toLowerCase()) ||
      category.description?.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && category.is_active) ||
      (statusFilter === "inactive" && !category.is_active)

    return matchesSearch && matchesStatus
  })

  // Modal handlers
  const handleAddCategory = () => {
    setSelectedCategory(null)
    setAddModalOpen(true)
  }

  const handleEditCategory = async (category) => {
    // Fetch category details including usage count
    try {
      const res = await fetch(`/api/categories/${category.id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedCategory(data.category)
        setEditModalOpen(true)
      }
    } catch (error) {
      console.error('Error fetching category details:', error)
      setSelectedCategory(category)
      setEditModalOpen(true)
    }
  }

  const handleDeleteCategory = async (category) => {
    // Fetch category details including usage count
    try {
      const res = await fetch(`/api/categories/${category.id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedCategory(data.category)
        setDeleteModalOpen(true)
      }
    } catch (error) {
      console.error('Error fetching category details:', error)
      setSelectedCategory(category)
      setDeleteModalOpen(true)
    }
  }

  const handleCategorySuccess = (category, action) => {
    if (action === 'created') {
      setCategories(prev => [category, ...prev])
    } else if (action === 'updated') {
      setCategories(prev => prev.map(c => c.id === category.id ? category : c))
    }
  }

  const handleDeleteSuccess = (categoryId) => {
    setCategories(prev => prev.filter(c => c.id !== categoryId))
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Categories
        </CardTitle>
        <Button onClick={handleAddCategory}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Categories Table */}
        <div className="grid gap-2">
          <div className="grid grid-cols-6 text-xs font-medium text-muted-foreground">
            <div>Name</div>
            <div>Description</div>
            <div>Color</div>
            <div>Status</div>
            <div>Created</div>
            <div>Actions</div>
          </div>
          {filteredCategories.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No categories found
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div key={category.id} className="grid grid-cols-6 items-center py-3 border-b last:border-b-0">
                <div>
                  <div className="font-medium">{category.name}</div>
                </div>
                <div className="text-sm">
                  {category.description ? (
                    <div className="truncate max-w-[200px]" title={category.description}>
                      {category.description}
                    </div>
                  ) : (
                    "-"
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {category.color ? (
                    <>
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="text-xs text-muted-foreground">
                        {category.color}
                      </span>
                    </>
                  ) : (
                    "-"
                  )}
                </div>
                <div>
                  <Badge variant={category.is_active ? "default" : "secondary"}>
                    {category.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(category.created_at)}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditCategory(category)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={loading}
                    onClick={() => handleDeleteCategory(category)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleCategorySuccess}
      />

      {/* Edit Category Modal */}
      <AddCategoryModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={handleCategorySuccess}
        category={selectedCategory}
      />

      {/* Delete Category Modal */}
      <DeleteCategoryModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDeleteSuccess}
        category={selectedCategory}
      />
    </Card>
  )
}
