'use client'

import { useState } from 'react'
import { DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export default function CashDrawerButton() {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleOpenDrawer = () => {
    setShowPasswordDialog(true)
    setPassword('')
  }

  const handleVerifyAndOpen = async () => {
    if (!password) {
      toast({
        title: "Error",
        description: "Please enter admin password",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      // Verify admin password
      const response = await fetch('/api/auth/verify-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        toast({
          title: "Access Denied",
          description: "Invalid admin password",
          variant: "destructive"
        })
        setIsLoading(false)
        return
      }

      // Open cash drawer
      await openCashDrawer()
      
      setShowPasswordDialog(false)
      setPassword('')
      
      toast({
        title: "Success",
        description: "Cash drawer opened",
      })
    } catch (error) {
      console.error('Error opening cash drawer:', error)
      toast({
        title: "Error",
        description: "Failed to open cash drawer",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openCashDrawer = async () => {
    try {
      // ESC/POS command to open cash drawer
      const ESC = '\x1B'
      const drawerCommand = ESC + 'p' + '\x00' + '\x19' + '\xFA'

      // Try to get printer settings
      const settings = localStorage.getItem('printer-settings')
      
      if (settings) {
        const printerSettings = JSON.parse(settings)
        
        if (printerSettings.printMethod === 'qz-tray' && printerSettings.printerName) {
          // Dynamically import QZ Tray (client-side only)
          const { initializeQZTray, printRawCommands } = await import('@/lib/qz-printer')
          const connected = await initializeQZTray()
          
          if (connected) {
            await printRawCommands(printerSettings.printerName, [drawerCommand])
          } else {
            throw new Error('Failed to connect to QZ Tray')
          }
        } else {
          toast({
            title: "Warning",
            description: "QZ Tray printer not configured. Please configure in settings.",
            variant: "destructive"
          })
        }
      } else {
        toast({
          title: "Warning",
          description: "No printer configured. Please configure printer in settings.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Cash drawer error:', error)
      throw error
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenDrawer}
        className="flex items-center gap-2"
      >
        <DollarSign className="h-4 w-4" />
        Open Drawer
      </Button>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Authentication Required</DialogTitle>
            <DialogDescription>
              Enter admin password to open the cash drawer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-password">Admin Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleVerifyAndOpen()
                  }
                }}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false)
                setPassword('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerifyAndOpen}
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Open Drawer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
