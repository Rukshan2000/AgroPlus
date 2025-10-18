# Thermal Printer Bill Implementation

## Overview
Implemented a thermal printer-friendly bill that displays when clicking "Print Bill" in the POS system. The bill includes sale ID, AgroPlus information, and "Thank you, please come again" message.

## Changes Made

### 1. Created ThermalReceipt Component
**File:** `/components/pos/ThermalReceipt.jsx`
- Created a new component optimized for 80mm thermal printers
- Includes:
  - **AgroPlus branding** with company name and contact info
  - **Sale ID** prominently displayed
  - **Date and time** of the transaction
  - **Itemized list** with quantities, prices, and discounts
  - **Subtotal, tax, and total** calculations
  - **"Thank You! Please Come Again"** message at the bottom
- Uses monospace font for receipt-like appearance
- Styled with inline styles for consistent printing

### 2. Updated POS System Page
**File:** `/app/(app)/pos/page.jsx`
- Added `saleId` state variable to store the sale ID
- Imported `ThermalReceipt` component
- Updated `processSale` function to capture sale ID from both:
  - Offline sales (PouchDB): Extracts from `offlineResult.sale._id`
  - Online sales (API): Extracts from `result.sales[0].id`
- Modified `printBill` function to:
  - Extract thermal receipt HTML
  - Open in a new window optimized for thermal printers (80mm width)
  - Apply print-specific styling
  - Auto-trigger print dialog
- Added hidden ThermalReceipt component to the page for print rendering
- Updated `clearCart` to reset the sale ID

### 3. Updated Receipt Modal
**File:** `/components/pos/Receipt.jsx`
- Added `saleId` prop
- Updated header to show "AgroPlus" instead of generic "POS System"
- Display sale ID when available (with monospace font for clarity)
- Maintained existing print and new sale functionality

### 4. Print Styling
**File:** `/app/globals-print.css`
- Created print-specific CSS for thermal receipts
- Configured @page size for 80mm thermal paper
- Ensured only the thermal receipt is visible when printing
- Applied black text on white background for optimal printing

## Features

### Thermal Receipt Format (80mm)
```
================================
        AGROPLUS
  Farm Fresh Products & Supplies
    Tel: +94 XX XXX XXXX
      www.agroplus.lk
--------------------------------
Sale ID: sale_xxxxxxxxxxxxx
Date: 10/18/2025
Time: 2:30:45 PM
--------------------------------
Product Name
2 x LKR 150.00          LKR 300.00
(-10% discount)

Another Product
1 x LKR 250.00          LKR 250.00
--------------------------------
Subtotal:               LKR 550.00
Tax (8%):               LKR 44.00
================================
TOTAL:                  LKR 594.00
--------------------------------
       Thank You!
    Please Come Again
   
  Your satisfaction is our priority
```

## How It Works

1. **Complete a Sale**: When a sale is processed, the system captures the sale ID
2. **View Receipt**: A modal receipt appears with sale details
3. **Click Print Bill**: Opens thermal printer preview in new window
4. **Auto Print**: Print dialog appears automatically for quick printing
5. **Thermal Format**: Receipt is formatted for 80mm thermal printers

## Technical Details

### Sale ID Handling
- **Offline Sales**: Uses PouchDB generated ID (e.g., `sale_1729267245123_abc123`)
- **Online Sales**: Uses PostgreSQL database ID (e.g., `123`)
- **Fallback**: If no ID available, generates timestamp-based ID

### Print Window Configuration
- Width: 302px (80mm at 96 DPI)
- Height: 600px (allows scrolling for longer receipts)
- Auto-closes after printing (user can cancel)

### Responsive Design
- Thermal receipt is hidden on screen (position: absolute, left: -9999px)
- Only visible when printing
- Modal receipt remains for screen viewing

## Browser Compatibility
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Print dialog must be allowed by browser

## Future Enhancements (Optional)
- Add cashier name to receipt
- Include payment method (cash, card, etc.)
- Add barcode/QR code with sale ID
- Support for different paper widths (58mm, 80mm)
- Save receipt as PDF option
- Email receipt option
