"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Printer, Check, X } from 'lucide-react'

export function PrinterSettings() {
  const [settings, setSettings] = useState({
    printMethod: 'browser', // browser, network, webusb, electron
    printerIP: '',
    printerPort: '9100',
    autoOpenCashDrawer: false,
    autoPrint: false,
    paperWidth: '80mm'
  })
  const [isTesting, setIsTesting] = useState(false)
  const { toast } = useToast()

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('printerSettings')
    if (saved) {
      setSettings(JSON.parse(saved))
    }
  }, [])

  const handleChange = (field, value) => {
    const newSettings = { ...settings, [field]: value }
    setSettings(newSettings)
    localStorage.setItem('printerSettings', JSON.stringify(newSettings))
  }

  const testPrinter = async () => {
    setIsTesting(true)
    
    try {
      if (settings.printMethod === 'network') {
        if (!settings.printerIP) {
          toast({
            title: "Error",
            description: "Please enter printer IP address",
            variant: "destructive"
          })
          setIsTesting(false)
          return
        }

        // Test network printer
        const response = await fetch('/api/print', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            printerIP: settings.printerIP,
            printerPort: parseInt(settings.printerPort),
            commands: '\x1B@\x1Ba1AgroPlus Test Print\n\n\x1DV\x41\x00'
          })
        })

        if (response.ok) {
          toast({
            title: "Success",
            description: "Test print sent successfully!",
          })
        } else {
          const error = await response.json()
          throw new Error(error.message)
        }
      } else if (settings.printMethod === 'webusb') {
        // Test WebUSB
        if (!navigator.usb) {
          throw new Error('WebUSB not supported in this browser')
        }
        
        toast({
          title: "WebUSB",
          description: "Please select your printer in the popup",
        })
        
        const { printViaWebUSB } = await import('@/lib/thermal-printer')
        await printViaWebUSB({
          storeName: 'AgroPlus',
          items: [{ name: 'Test Item', quantity: 1, total: 0 }],
          subtotal: 0,
          tax: 0,
          total: 0,
          saleId: 'TEST',
          date: new Date().toLocaleString()
        })
        
        toast({
          title: "Success",
          description: "Test print sent via WebUSB!",
        })
      } else {
        // Browser print
        toast({
          title: "Browser Print",
          description: "Browser print uses system print dialog",
        })
      }
    } catch (error) {
      console.error('Test print error:', error)
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Printer className="h-5 w-5" />
          <CardTitle>Printer Configuration</CardTitle>
        </div>
        <CardDescription>
          Configure your thermal receipt printer settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Print Method */}
        <div className="space-y-2">
          <Label>Print Method</Label>
          <Select 
            value={settings.printMethod} 
            onValueChange={(value) => handleChange('printMethod', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="browser">
                <div className="flex flex-col items-start">
                  <span>Browser Print (Default)</span>
                  <span className="text-xs text-muted-foreground">Uses system print dialog</span>
                </div>
              </SelectItem>
              <SelectItem value="network">
                <div className="flex flex-col items-start">
                  <span>Network Printer</span>
                  <span className="text-xs text-muted-foreground">Direct to IP printer (80mm thermal)</span>
                </div>
              </SelectItem>
              <SelectItem value="webusb">
                <div className="flex flex-col items-start">
                  <span>USB Printer (WebUSB)</span>
                  <span className="text-xs text-muted-foreground">Chrome/Edge only - requires permission</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Network Printer Settings */}
        {settings.printMethod === 'network' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="printerIP">Printer IP Address</Label>
              <Input
                id="printerIP"
                placeholder="192.168.1.100"
                value={settings.printerIP}
                onChange={(e) => handleChange('printerIP', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Find your printer's IP in its network settings
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="printerPort">Printer Port</Label>
              <Input
                id="printerPort"
                placeholder="9100"
                value={settings.printerPort}
                onChange={(e) => handleChange('printerPort', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Default: 9100 (RAW printing port)
              </p>
            </div>
          </>
        )}

        {/* Paper Width */}
        <div className="space-y-2">
          <Label>Paper Width</Label>
          <Select 
            value={settings.paperWidth} 
            onValueChange={(value) => handleChange('paperWidth', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="58mm">58mm</SelectItem>
              <SelectItem value="80mm">80mm (Standard)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Additional Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto Print</Label>
              <p className="text-xs text-muted-foreground">
                Automatically print after checkout
              </p>
            </div>
            <Switch
              checked={settings.autoPrint}
              onCheckedChange={(checked) => handleChange('autoPrint', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Open Cash Drawer</Label>
              <p className="text-xs text-muted-foreground">
                Send drawer kick command with print
              </p>
            </div>
            <Switch
              checked={settings.autoOpenCashDrawer}
              onCheckedChange={(checked) => handleChange('autoOpenCashDrawer', checked)}
            />
          </div>
        </div>

        {/* Test Button */}
        <div className="pt-4">
          <Button 
            onClick={testPrinter} 
            disabled={isTesting}
            className="w-full"
          >
            {isTesting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Testing Printer...
              </>
            ) : (
              <>
                <Printer className="h-4 w-4 mr-2" />
                Test Print
              </>
            )}
          </Button>
        </div>

        {/* Help Text */}
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <h4 className="font-semibold text-sm">Setup Tips:</h4>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>• <strong>Browser Print:</strong> Works everywhere, shows print dialog</li>
            <li>• <strong>Network Printer:</strong> Best for production - no dialog, direct print</li>
            <li>• <strong>WebUSB:</strong> Direct USB connection, requires user permission once</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
