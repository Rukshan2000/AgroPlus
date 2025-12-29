'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus } from 'lucide-react'
import { BarcodeDisplay } from '@/components/barcode-display'

export default function AddUserModal({ onUserAdded }) {
  const [open, setOpen] = useState(false)
  const [csrf, setCsrf] = useState('')
  const [outlets, setOutlets] = useState([])
  const [createdUser, setCreatedUser] = useState(null)
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    role: 'user',
    hourlyRate: '',
    position: '',
    outlets: [],
    generateBarcode: true // Enable barcode by default
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/csrf')
      .then((r) => r.json())
      .then((d) => setCsrf(d.csrfToken))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (open) {
      fetchOutlets()
    }
  }, [open])

  async function fetchOutlets() {
    try {
      const res = await fetch('/api/outlets?action=active')
      if (res.ok) {
        const data = await res.json()
        setOutlets(data.outlets || [])
      }
    } catch (error) {
      console.error('Error fetching outlets:', error)
    }
  }

  const resetForm = () => {
    setForm({
      email: '',
      password: '',
      name: '',
      role: 'user',
      hourlyRate: '',
      position: '',
      outlets: [],
      generateBarcode: true
    })
    setError('')
    setCreatedUser(null)
  }

  const handleOutletToggle = (outletId) => {
    setForm(prev => ({
      ...prev,
      outlets: prev.outlets.includes(outletId)
        ? prev.outlets.filter(id => id !== outletId)
        : [...prev.outlets, outletId]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrf
        },
        body: JSON.stringify(form)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user')
      }

      // User created successfully
      setCreatedUser({
        user: data.user,
        barcodeId: data.barcodeId
      })
      onUserAdded(data.user)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Show barcode modal after user creation */}
      {createdUser && (
        <BarcodeDisplay
          barcodeId={createdUser.barcodeId}
          userName={createdUser.user.name}
          userEmail={createdUser.user.email}
          onClose={() => {
            setCreatedUser(null)
            setOpen(false)
            resetForm()
          }}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with payroll information and outlet assignments.
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(form.role === 'cashier' || form.role === 'user') && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.hourlyRate}
                    onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                    placeholder="15.00"
                    required={form.role === 'cashier'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    placeholder="Cashier, Sales Associate, etc."
                    required={form.role === 'cashier'}
                  />
                </div>
              </>
            )}

            {outlets.length > 0 && (
              <div className="space-y-2">
                <Label>Assign Outlets</Label>
                <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                  {outlets.map((outlet) => (
                    <div key={outlet.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`outlet-${outlet.id}`}
                        checked={form.outlets.includes(outlet.id)}
                        onCheckedChange={() => handleOutletToggle(outlet.id)}
                      />
                      <Label 
                        htmlFor={`outlet-${outlet.id}`}
                        className="cursor-pointer font-normal"
                      >
                        {outlet.name}
                      </Label>
                    </div>
                  ))}
                </div>
                {form.outlets.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {form.outlets.length} outlet(s) selected
                  </p>
                )}
              </div>
            )}

            {/* Barcode Generation Option */}
            <div className="flex items-center space-x-2 border-t pt-4">
              <Checkbox
                id="generateBarcode"
                checked={form.generateBarcode}
                onCheckedChange={(checked) => setForm({ ...form, generateBarcode: checked })}
              />
              <Label 
                htmlFor="generateBarcode"
                className="cursor-pointer font-normal flex-1"
              >
                Generate login barcode for this user
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

