"use client"

import { useEffect, useState } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function OutletSelectionModal({ outlets, onOutletSelected }) {
  const [selectedOutlet, setSelectedOutlet] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Set first outlet as default
    if (outlets && outlets.length > 0) {
      setSelectedOutlet(outlets[0].id.toString())
    }
  }, [outlets])

  const handleSubmit = async () => {
    if (!selectedOutlet) return

    setLoading(true)
    try {
      // Store selected outlet in localStorage
      localStorage.setItem("selectedOutlet", selectedOutlet)
      localStorage.setItem("selectedOutletName", 
        outlets.find(o => o.id.toString() === selectedOutlet)?.name || ""
      )
      
      // Notify parent component
      onOutletSelected(parseInt(selectedOutlet))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={true}>
      <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Select Your Outlet</DialogTitle>
          <DialogDescription>
            You have access to multiple outlets. Please select the outlet you want to work with.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={selectedOutlet} onValueChange={setSelectedOutlet}>
            <div className="space-y-3">
              {outlets && outlets.map((outlet) => (
                <div key={outlet.id} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={outlet.id.toString()} 
                    id={`outlet-${outlet.id}`}
                  />
                  <Label 
                    htmlFor={`outlet-${outlet.id}`}
                    className="cursor-pointer font-normal flex-1"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{outlet.name}</span>
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
          </RadioGroup>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button 
            onClick={handleSubmit}
            disabled={!selectedOutlet || loading}
          >
            {loading ? "Continuing..." : "Continue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
