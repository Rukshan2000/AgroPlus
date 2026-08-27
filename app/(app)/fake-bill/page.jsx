'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Printer, Trash2, Plus, FileWarning } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ThermalReceipt from '@/components/pos/ThermalReceipt'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Fake Bill Generator — client-side only. Does NOT call /api/sales, so it never
// touches stock or writes to the database. It renders and prints the exact same
// ThermalReceipt component the real POS uses, so the output is identical.
// Resolve a discount entered as either a percentage or a flat LKR amount.
// Mirrors the same helper in the POS page: a LKR discount comes off the LINE
// TOTAL (price x qty), so qty 5 @ LKR 10 less LKR 20 => 30, unit price 6.
function resolveDiscount(originalPrice, quantity, value, type) {
  const raw = Math.max(0, parseFloat(value) || 0)
  const qty = parseFloat(quantity) || 0
  const lineTotal = originalPrice * qty

  if (type === 'price') {
    const amount = Math.min(raw, lineTotal)
    const unitPrice = qty > 0 ? (lineTotal - amount) / qty : originalPrice
    const percent = lineTotal > 0 ? (amount / lineTotal) * 100 : 0
    return { percent, unitPrice, amount }
  }

  const percent = Math.min(100, raw)
  const unitPrice = originalPrice - (originalPrice * percent) / 100
  return { percent, unitPrice, amount: (originalPrice - unitPrice) * qty }
}

export default function FakeBillPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [itemDiscount, setItemDiscount] = useState('0')
  const [itemDiscountType, setItemDiscountType] = useState('percentage')
  const [cart, setCart] = useState([])
  const [billDiscount, setBillDiscount] = useState('0')
  const [billDiscountType, setBillDiscountType] = useState('percentage')
  const [billDate, setBillDate] = useState(() => new Date().toISOString().slice(0, 16))
  const [billNumber, setBillNumber] = useState(() => Date.now().toString().slice(-8))

  useEffect(() => {
    fetch('/api/products?limit=1000&is_active=true', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setProducts(data.products || []))
      .catch(() => {
        toast({
          title: 'Error',
          description: 'Failed to load products',
          variant: 'destructive',
        })
      })
  }, [])

  const addToCart = () => {
    const product = products.find((p) => p.id.toString() === selectedProductId)
    if (!product) {
      toast({ title: 'Select a product', variant: 'destructive' })
      return
    }
    const qty = Math.max(0.01, parseFloat(quantity) || 1)
    const price = parseFloat(product.price) || 0
    const { percent, unitPrice } = resolveDiscount(price, qty, itemDiscount, itemDiscountType)

    setCart((prev) => [
      ...prev,
      {
        key: `${product.id}-${Date.now()}`,
        id: product.id,
        name: product.name,
        sku: product.sku,
        quantity: qty,
        discount: percent,
        discountType: itemDiscountType,
        originalPrice: price,
        unitPrice,
        total: unitPrice * qty,
      },
    ])

    setSelectedProductId('')
    setQuantity('1')
    setItemDiscount('0')
  }

  const removeFromCart = (key) => {
    setCart((prev) => prev.filter((item) => item.key !== key))
  }

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.total, 0), [cart])
  // Bill discount resolves against the subtotal, in whichever unit was chosen
  const billDiscountRaw = Math.max(0, parseFloat(billDiscount) || 0)
  const billDiscountAmount = billDiscountType === 'price'
    ? Math.min(billDiscountRaw, subtotal)
    : (subtotal * Math.min(100, billDiscountRaw)) / 100
  const billDiscountPct = subtotal > 0 ? (billDiscountAmount / subtotal) * 100 : 0
  const total = Math.max(0, subtotal - billDiscountAmount)

  // Same browser-print flow as the POS: copy the rendered receipt into a hidden
  // 80mm iframe and print it.
  const printBill = () => {
    if (cart.length === 0) {
      toast({ title: 'Cart is empty', variant: 'destructive' })
      return
    }

    const receiptContent = document.getElementById('thermal-receipt')
    if (!receiptContent) {
      toast({
        title: 'Print Error',
        description: 'Receipt content not found',
        variant: 'destructive',
      })
      return
    }

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentWindow.document

    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Receipt - Bill #${billNumber || 'N/A'}</title>
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
            body {
              margin: 0;
              padding: 0;
              font-family: monospace;
              width: 80mm;
            }
          </style>
        </head>
        <body>
          ${receiptContent.innerHTML}
        </body>
      </html>
    `)
    iframeDoc.close()

    iframe.onload = () => {
      try {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()

        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 1000)
      } catch (error) {
        console.error('Print error:', error)
        document.body.removeChild(iframe)
        toast({
          title: 'Print Error',
          description: 'Failed to print receipt',
          variant: 'destructive',
        })
      }
    }
  }

  const clearAll = () => {
    setCart([])
    setBillDiscount('0')
    setBillNumber(Date.now().toString().slice(-8))
    setBillDate(new Date().toISOString().slice(0, 16))
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-2 rounded-md border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 px-3 py-2 text-sm text-yellow-800 dark:text-yellow-300">
        <FileWarning className="h-4 w-4 shrink-0" />
        This bill is for demo/testing only. It does not deduct stock, create a sale record, or affect the database in any way.
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fake Bill Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Bill Number</Label>
              <Input value={billNumber} onChange={(e) => setBillNumber(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Date &amp; Time</Label>
              <Input
                type="datetime-local"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end border-t pt-4">
            <div className="space-y-1 sm:col-span-2">
              <Label>Product</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name} — LKR {(parseFloat(product.price) || 0).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Qty</Label>
              <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>Discount</Label>
                <div className="flex border rounded overflow-hidden">
                  <button
                    type="button"
                    onClick={() => { setItemDiscountType('percentage'); setItemDiscount('0') }}
                    className={`px-2 py-0.5 text-xs font-medium ${itemDiscountType === 'percentage' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70'}`}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => { setItemDiscountType('price'); setItemDiscount('0') }}
                    className={`px-2 py-0.5 text-xs font-medium ${itemDiscountType === 'price' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70'}`}
                  >
                    LKR
                  </button>
                </div>
              </div>
              <Input
                type="number"
                min="0"
                step="0.01"
                max={itemDiscountType === 'percentage' ? 100 : undefined}
                value={itemDiscount}
                onChange={(e) => setItemDiscount(e.target.value)}
              />
            </div>
            <div className="sm:col-span-4">
              <Button onClick={addToCart} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items added yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.map((item) => (
                  <TableRow key={item.key}>
                    <TableCell>
                      {item.name}
                      {item.discount > 0 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          {item.discountType === 'price'
                            ? `(-LKR ${((item.originalPrice - item.unitPrice) * item.quantity).toFixed(2)})`
                            : `(-${item.discount.toFixed(1)}%)`}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">{item.unitPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">{item.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.key)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex flex-col items-end gap-2 mt-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">Bill Discount</Label>
              <div className="flex border rounded overflow-hidden">
                <button
                  type="button"
                  onClick={() => { setBillDiscountType('percentage'); setBillDiscount('0') }}
                  className={`px-2 py-1 text-xs font-medium ${billDiscountType === 'percentage' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70'}`}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => { setBillDiscountType('price'); setBillDiscount('0') }}
                  className={`px-2 py-1 text-xs font-medium ${billDiscountType === 'price' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70'}`}
                >
                  LKR
                </button>
              </div>
              <Input
                type="number"
                min="0"
                step="0.01"
                max={billDiscountType === 'percentage' ? 100 : undefined}
                value={billDiscount}
                onChange={(e) => setBillDiscount(e.target.value)}
                className="w-24"
              />
            </div>
            <div className="text-sm text-muted-foreground">Subtotal: LKR {subtotal.toFixed(2)}</div>
            {billDiscountAmount > 0 && (
              <div className="text-sm text-orange-600">Discount: -LKR {billDiscountAmount.toFixed(2)}</div>
            )}
            <div className="text-lg font-bold">Total: LKR {total.toFixed(2)}</div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={printBill} className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Print Bill
            </Button>
            <Button variant="outline" onClick={clearAll}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live preview of the real receipt design */}
      {cart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center overflow-x-auto">
            <div className="border shadow-sm">
              <ThermalReceipt
                cart={cart}
                saleId={billNumber}
                billDiscount={billDiscountPct}
                billDiscountType={billDiscountType}
                date={billDate}
              />
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
