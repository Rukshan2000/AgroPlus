'use client'

import { useState } from 'react'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export default function PrintProductsButton({ products }) {
  const { toast } = useToast()

  const handlePrintProductList = () => {
    try {
      // Group products by category
      const productsByCategory = {}
      products.forEach(product => {
        const category = product.category || 'Uncategorized'
        if (!productsByCategory[category]) {
          productsByCategory[category] = []
        }
        productsByCategory[category].push(product)
      })

      // Create print window
      const printWindow = window.open('', '_blank')
      
      // Generate HTML for product list
      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Product List - Green Plus Agro</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              font-size: 14px;
            }
            h1 {
              text-align: center;
              color: #059669;
              margin-bottom: 5px;
            }
            .subtitle {
              text-align: center;
              color: #666;
              margin-bottom: 20px;
            }
            .category {
              margin-top: 25px;
              page-break-inside: avoid;
            }
            .category-header {
              background: #059669;
              color: white;
              padding: 8px 12px;
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              background: #f3f4f6;
              padding: 8px;
              text-align: left;
              border: 1px solid #ddd;
              font-weight: bold;
            }
            td {
              padding: 8px;
              border: 1px solid #ddd;
            }
            tr:nth-child(even) {
              background: #f9fafb;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #666;
              font-size: 12px;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <h1>Green Plus Agro - Product List</h1>
          <div class="subtitle">Complete Product Inventory - ${new Date().toLocaleDateString()}</div>
          <button class="no-print" onclick="window.print()" style="padding: 10px 20px; background: #059669; color: white; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 20px;">Print</button>
      `

      // Add each category and its products
      Object.keys(productsByCategory).sort().forEach(category => {
        html += `
          <div class="category">
            <div class="category-header">${category}</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 15%;">ID</th>
                  <th style="width: 60%;">Product Name</th>
                  <th style="width: 25%;">Price (LKR)</th>
                </tr>
              </thead>
              <tbody>
        `
        
        productsByCategory[category].forEach(product => {
          html += `
                <tr>
                  <td>${product.product_id}</td>
                  <td>${product.name}</td>
                  <td style="text-align: right;">${parseFloat(product.price || 0).toFixed(2)}</td>
                </tr>
          `
        })

        html += `
              </tbody>
            </table>
          </div>
        `
      })

      // Add footer
      html += `
          <div class="footer">
            <p>Total Products: ${products.length} | Categories: ${Object.keys(productsByCategory).length}</p>
            <p>Printing Date: ${new Date().toLocaleString()}</p>
          </div>
        </body>
        </html>
      `

      printWindow.document.write(html)
      printWindow.document.close()

      toast({
        title: "Success",
        description: "Product list opened in new window",
      })
    } catch (error) {
      console.error('Print error:', error)
      toast({
        title: "Error",
        description: "Failed to generate product list",
        variant: "destructive"
      })
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePrintProductList}
      className="flex items-center gap-2"
    >
      <Printer className="h-4 w-4" />
      Print Products
    </Button>
  )
}
