"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog"

export default function AddCategoryModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  category = null 
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6", // Default blue color
    is_active: true
  })
  const [errors, setErrors] = useState({})

  const isEditing = !!category

  useEffect(() => {
    if (isOpen) {
      if (category) {
        // Edit mode - populate form with category data
        setFormData({
          name: category.name || "",
          description: category.description || "",
          color: category.color || "#3B82F6",
          is_active: category.is_active
        })
      } else {
        // Add mode - reset form
        setFormData({
          name: "",
          description: "",
          color: "#3B82F6",
          is_active: true
        })
      }
      setErrors({})
    }
  }, [isOpen, category])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Category name is required"
    }

    if (formData.color && !/^#[0-9A-F]{6}$/i.test(formData.color)) {
      newErrors.color = "Color must be a valid hex code (e.g., #FF5733)"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const csrf = await fetch("/api/auth/csrf")
        .then((r) => r.json())
        .then((d) => d.csrfToken)

      const payload = {
        ...formData,
        description: formData.description.trim() || undefined,
        color: formData.color || undefined
      }

      const url = isEditing ? `/api/categories/${category.id}` : "/api/categories"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrf
        },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const data = await res.json()
        onSuccess(data.category, isEditing ? 'updated' : 'created')
        onClose()
      } else {
        const err = await res.json().catch(() => ({}))
        if (err.details) {
          setErrors(err.details)
        } else {
          alert(err.error || `Failed to ${isEditing ? "update" : "create"} category`)
        }
      }
    } catch (error) {
      alert(`Failed to ${isEditing ? "update" : "create"} category`)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Category" : "Add New Category"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Update category information" : "Create a new category for organizing products"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter category name"
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter category description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => handleInputChange("color", e.target.value)}
                className="w-16 h-10 p-1 border rounded"
              />
              <Input
                value={formData.color}
                onChange={(e) => handleInputChange("color", e.target.value)}
                placeholder="#3B82F6"
                className={`flex-1 ${errors.color ? "border-destructive" : ""}`}
              />
            </div>
            {errors.color && (
              <p className="text-sm text-destructive">{errors.color}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange("is_active", checked)}
            />
            <Label htmlFor="is_active">Active Category</Label>
          </div>
        </form>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
          >
            {loading ? "Saving..." : (isEditing ? "Update Category" : "Create Category")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
