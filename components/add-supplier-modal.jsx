"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

export default function AddSupplierModal({
  open,
  onOpenChange,
  initialSupplier = null,
  isEdit = false,
  onSuccess
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(
    initialSupplier || {
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postal_code: "",
      country: "",
      payment_terms: "",
      payment_method: "bank_transfer",
      bank_account: "",
      bank_name: "",
      supplier_type: "wholesale",
      tax_id: "",
      is_active: true,
      rating: 5,
      notes: ""
    }
  )

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const csrfRes = await fetch("/api/auth/csrf")
      const csrfData = await csrfRes.json()
      const csrfToken = csrfData.csrfToken || csrfData.token

      const method = isEdit ? "PUT" : "POST"
      const url = isEdit ? `/api/suppliers/${initialSupplier.id}` : "/api/suppliers"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details?.name?.[0] || error.error || "Failed to save supplier")
      }

      const data = await response.json()
      toast({
        title: "Success",
        description: isEdit ? "Supplier updated successfully" : "Supplier created successfully"
      })
      onOpenChange(false)
      onSuccess(data)
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Supplier" : "Add New Supplier"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label htmlFor="name">Supplier Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter supplier name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  placeholder="John Doe"
                  value={formData.contact_person}
                  onChange={(e) => handleChange("contact_person", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="supplier@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplier_type">Supplier Type</Label>
                  <Select value={formData.supplier_type} onValueChange={(value) => handleChange("supplier_type", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wholesale">Wholesale</SelectItem>
                      <SelectItem value="manufacturer">Manufacturer</SelectItem>
                      <SelectItem value="distributor">Distributor</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="rating">Rating</Label>
                  <Input
                    id="rating"
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) => handleChange("rating", parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tax_id">Tax ID / VAT ID</Label>
                <Input
                  id="tax_id"
                  placeholder="Tax identification number"
                  value={formData.tax_id}
                  onChange={(e) => handleChange("tax_id", e.target.value)}
                />
              </div>
            </TabsContent>

            {/* Location Tab */}
            <TabsContent value="location" className="space-y-4">
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="Street address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    placeholder="12345"
                    value={formData.postal_code}
                    onChange={(e) => handleChange("postal_code", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="Country"
                  value={formData.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                />
              </div>
            </TabsContent>

            {/* Payment Tab */}
            <TabsContent value="payment" className="space-y-4">
              <div>
                <Label htmlFor="payment_terms">Payment Terms</Label>
                <Input
                  id="payment_terms"
                  placeholder="e.g., Net 30, COD, Prepaid"
                  value={formData.payment_terms}
                  onChange={(e) => handleChange("payment_terms", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select value={formData.payment_method} onValueChange={(value) => handleChange("payment_method", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  placeholder="Bank name"
                  value={formData.bank_name}
                  onChange={(e) => handleChange("bank_name", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="bank_account">Bank Account</Label>
                <Input
                  id="bank_account"
                  placeholder="Account number"
                  value={formData.bank_account}
                  onChange={(e) => handleChange("bank_account", e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this supplier"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update Supplier" : "Add Supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
