# POS Returns Feature - Quick Guide

## Overview
Cashiers and other users can now process returns directly from the POS system without leaving the cashier interface.

## Features Added

### 1. Returns Button in POS Header
- Located in the top navigation bar of the POS system
- Accessible to all users including cashiers
- Opens a dedicated returns modal

### 2. POS Returns Modal (`components/pos-return-modal.jsx`)

**Features:**
- ✅ Search recent sales (last 20 transactions)
- ✅ Search by Sale ID, Product Name, or SKU
- ✅ View sale details before processing return
- ✅ Automatic eligibility checking
- ✅ Shows returnable quantity
- ✅ Real-time refund calculation
- ✅ Return reason tracking
- ✅ Restock inventory option
- ✅ Shows return status (Available, Partially Returned, Fully Returned)

## How to Use

### For Cashiers

1. **Open Returns Modal:**
   - Click the "Returns" button in the POS header (top right)

2. **Find the Sale:**
   - Browse recent sales in the table
   - Or use the search box to find by:
     - Sale ID (e.g., #123)
     - Product name
     - SKU

3. **Select Sale:**
   - Click "Select" button on the sale to return
   - System automatically checks eligibility
   - View sale details and available return quantity

4. **Process Return:**
   - Enter quantity to return
   - Optionally add a return reason
   - Check/uncheck "Add items back to inventory"
   - Review refund amount
   - Click "Process Return"

5. **Confirmation:**
   - Toast notification shows success
   - Refund amount displayed
   - Inventory automatically updated (if restocked)
   - Can process another return or close modal

## Access Control

| Role     | POS Access | Returns Access | Notes |
|----------|-----------|----------------|-------|
| Admin    | ✅        | ✅             | Full access |
| Manager  | ✅        | ✅             | Full access |
| User     | ✅        | ✅             | Full access |
| Cashier  | ✅        | ✅             | Can process returns from POS |

## Technical Details

### Files Modified

1. **`app/(app)/pos/page.jsx`**
   - Added Returns button in header
   - Integrated POSReturnModal
   - Added handleReturnSuccess callback

2. **`components/pos-return-modal.jsx`** (NEW)
   - Standalone POS-specific returns modal
   - Simplified workflow for cashier use
   - Integrated recent sales search
   - Two-step process: Select Sale → Process Return

3. **`components/sidebar.jsx`**
   - Added "Returns" link to Sales & POS section
   - Made accessible to cashiers

### Workflow

```
POS → Returns Button
  ↓
Search/Browse Recent Sales
  ↓
Select Sale
  ↓
System Checks Eligibility
  ↓
Enter Return Details
  ↓
Process Return
  ↓
Success + Inventory Update
```

### API Endpoints Used

- `GET /api/sales?limit=20&page=1` - Load recent sales
- `GET /api/returns?check_eligibility=true&sale_id=X&product_id=Y` - Check if returnable
- `POST /api/returns` - Process the return

### Return Logic

Same as the main returns system:
1. Validates eligibility
2. Checks quantity limits
3. Calculates proportional refund
4. Updates inventory (if restocked)
5. Adjusts profit
6. Updates sale status
7. Deducts loyalty points

## UI/UX Features

### Recent Sales Table
- Shows last 20 sales
- Displays: Sale ID, Product, SKU, Quantity, Amount, Status
- Color-coded status badges
- Disabled "Select" for fully returned items

### Return Form
- Clear sale information display
- Quantity selector with validation
- Optional return reason textarea
- Restock checkbox (default: checked)
- Large refund amount display
- Back button to change selection

### Status Indicators
- 🟢 **Available** - Can be returned
- 🟡 **Partially Returned** - Some items returned, more available
- 🔴 **Fully Returned** - Cannot return (button disabled)

## Keyboard Shortcuts

Same POS shortcuts still work:
- `F1` - Focus Product Input
- `F2` - Complete Sale
- `F3` - Clear Cart
- `F4` - Search Products
- `Enter` - Add Item

## Benefits for Cashiers

1. **No Navigation Required** - Process returns without leaving POS
2. **Quick Sale Lookup** - Recent sales always at hand
3. **Visual Feedback** - Clear status indicators
4. **Simple Workflow** - Just 2 steps: Select → Process
5. **Automatic Updates** - Inventory syncs immediately
6. **Error Prevention** - Validates quantities and eligibility

## Common Scenarios

### Scenario 1: Customer Returns Defective Item
1. Click "Returns" button
2. Search for the sale by Sale ID or product name
3. Click "Select" on the sale
4. Enter quantity to return
5. Add reason: "Defective product"
6. Uncheck "Add items back to inventory" (defective items)
7. Click "Process Return"

### Scenario 2: Customer Changed Mind
1. Click "Returns" button
2. Find the recent sale
3. Select it
4. Enter full quantity
5. Add reason: "Customer changed mind"
6. Keep "Add items back to inventory" checked
7. Click "Process Return"

### Scenario 3: Partial Return
1. Open returns modal
2. Select the sale
3. Enter partial quantity (e.g., 2 out of 5)
4. System calculates proportional refund
5. Process return
6. Sale marked as "Partially Returned"
7. Remaining items can still be returned later

## Troubleshooting

### "This item cannot be returned"
- Sale may be fully returned already
- Check the status column in the sales table

### Can't find the sale
- Try searching by different criteria (ID, name, SKU)
- Sale might be older than the last 20 transactions
- Use the main Returns page (`/returns`) for older sales

### Return button disabled
- Sale is already fully returned
- Check status badge for confirmation

## Testing Checklist

- [ ] Cashier can access Returns button from POS
- [ ] Recent sales load correctly
- [ ] Search filters sales properly
- [ ] Can select available sale
- [ ] Eligibility check works
- [ ] Fully returned sales are disabled
- [ ] Quantity validation works
- [ ] Refund calculates correctly
- [ ] Return processes successfully
- [ ] Inventory updates (if restocked)
- [ ] Toast notification appears
- [ ] Can process multiple returns in succession

## Future Enhancements

- Keyboard shortcut for Returns (e.g., F5)
- Print return receipt
- Filter by date range
- Export returns to CSV
- Barcode scan for quick sale lookup
- Return multiple items from same transaction
- Manager approval for high-value returns

---

**Status:** ✅ Ready for Use
**Last Updated:** October 18, 2025
