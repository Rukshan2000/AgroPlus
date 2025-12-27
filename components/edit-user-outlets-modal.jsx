"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function EditUserOutletsModal({ isOpen, onClose, user, onSuccess }) {
  const [outlets, setOutlets] = useState([])
  const [selectedOutlets, setSelectedOutlets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      fetchOutlets()
      setSelectedOutlets(user.outlets || [])
    }
  }, [isOpen, user])

  async function fetchOutlets() {
    setFetching(true)
    try {
      const res = await fetch("/api/outlets?action=active")
      if (res.ok) {
        const data = await res.json()
        setOutlets(data.outlets || [])
      } else {
        setError("Failed to load outlets")
      }
    } catch (err) {
      setError("Error loading outlets")
    } finally {
      setFetching(false)
    }
  }

  const handleOutletToggle = (outletId) => {
    setSelectedOutlets((prev) =>
      prev.includes(outletId)
        ? prev.filter((id) => id !== outletId)
        : [...prev, outletId]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const csrf = await fetch("/api/auth/csrf")
        .then((r) => r.json())
        .then((d) => d.csrfToken)

      const res = await fetch(`/api/users/${user.id}/outlets`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrf,
        },
        body: JSON.stringify({ outlets: selectedOutlets }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to update outlets")
      }

      const data = await res.json()
      onSuccess(data.user)
    } catch (err) {
      setError(err.message || "Failed to update outlets")
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Outlets</DialogTitle>
          <DialogDescription>
            Assign outlets to user: <strong>{user.email}</strong>
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {fetching ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading outlets...
            </div>
          ) : outlets.length > 0 ? (
            <div className="border rounded-md p-3 space-y-3 max-h-64 overflow-y-auto">
              {outlets.map((outlet) => (
                <div key={outlet.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`outlet-${outlet.id}`}
                    checked={selectedOutlets.includes(outlet.id)}
                    onCheckedChange={() => handleOutletToggle(outlet.id)}
                    disabled={loading}
                  />
                  <Label
                    htmlFor={`outlet-${outlet.id}`}
                    className="cursor-pointer font-normal flex-1"
                  >
                    <div className="flex flex-col">
                      <span>{outlet.name}</span>
                      {outlet.location && (
                        <span className="text-xs text-muted-foreground">
                          {outlet.location}
                        </span>
                      )}
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No outlets available
            </div>
          )}

          {selectedOutlets.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedOutlets.length} outlet(s) selected
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || fetching}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
