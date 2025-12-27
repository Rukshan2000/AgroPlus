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

export default function AddOutletModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  outlet = null 
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    address: "",
    phone: "",
    email: "",
    manager: "",
    is_active: true
  })
  const [errors, setErrors] = useState({})

  const isEditing = !!outlet

  useEffect(() => {
    if (isOpen) {
      if (outlet) {
        // Edit mode - populate form with outlet data
        setFormData({
          name: outlet.name || "",
          location: outlet.location || "",
          address: outlet.address || "",
          phone: outlet.phone || "",
          email: outlet.email || "",
          manager: outlet.manager || "",
          is_active: outlet.is_active
        })
      } else {
        // Add mode - reset form
        setFormData({
          name: "",
          location: "",
          address: "",
          phone: "",
          email: "",
          manager: "",
          is_active: true
        })
      }
      setErrors({})
    }
  }, [isOpen, outlet])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Outlet name is required"
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
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
        location: formData.location.trim() || undefined,
        address: formData.address.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        manager: formData.manager.trim() || undefined
      }

      const url = isEditing ? `/api/outlets` : "/api/outlets"
      const method = isEditing ? "PUT" : "POST"

      const requestBody = isEditing 
        ? { id: outlet.id, ...payload }
        : payload

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrf
        },
        body: JSON.stringify(requestBody)
      })

      if (res.ok) {
        const data = await res.json()
        onSuccess(data, isEditing ? 'updated' : 'created')
        onClose()
      } else {
        const err = await res.json().catch(() => ({}))
        if (err.details) {
          const errorObj = {}
          err.details.forEach(detail => {
            errorObj[detail.path?.[0] || 'general'] = detail.message
          })
          setErrors(errorObj)
        } else {
          alert(err.error || `Failed to ${isEditing ? "update" : "create"} outlet`)
        }
      }
    } catch (error) {
      alert(`Failed to ${isEditing ? "update" : "create"} outlet`)
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Outlet" : "Add New Outlet"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Update outlet information" : "Create a new outlet location"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Outlet Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Main Store, Outlet #2"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              disabled={loading}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Downtown, Mall"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              disabled={loading}
            />
            {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              placeholder="Full address of the outlet"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              disabled={loading}
              rows={3}
            />
            {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              placeholder="Contact phone number"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              disabled={loading}
            />
            {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="outlet@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              disabled={loading}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager">Manager Name</Label>
            <Input
              id="manager"
              placeholder="Name of outlet manager"
              value={formData.manager}
              onChange={(e) => handleInputChange("manager", e.target.value)}
              disabled={loading}
            />
            {errors.manager && <p className="text-sm text-red-500">{errors.manager}</p>}
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange("is_active", checked)}
              disabled={loading}
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Active
            </Label>
          </div>

          {errors.general && <p className="text-sm text-red-500">{errors.general}</p>}

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
              type="submit"
              disabled={loading}
            >
              {loading ? "Saving..." : isEditing ? "Update Outlet" : "Create Outlet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
