# Supplier Management - Access Guide

## 🎯 Quick Access Routes

### Suppliers Page
**URL**: `http://localhost:3000/suppliers`
**Path**: `/app/(app)/suppliers/page.jsx`

### Purchase Orders Page  
**URL**: `http://localhost:3000/purchase-orders`
**Path**: `/app/(app)/purchase-orders/page.jsx`

---

## 📍 Sidebar Navigation

### Updated Sidebar Structure

```
Navigation Menu Structure:
│
├─ Main
│  └─ Dashboard
│
├─ Sales & POS [▼]
│  ├─ POS System
│  ├─ Sales History
│  └─ Returns
│
├─ Inventory [▼]
│  ├─ Products
│  └─ Categories
│
├─ Procurement [▼] ← NEW SECTION
│  ├─ 🚚 Suppliers
│  └─ 🛒 Purchase Orders
│
├─ Customer Loyalty [▼]
│  ├─ Customers
│  ├─ Program Settings
│  └─ Rewards
│
├─ Human Resources [▼]
│  ├─ HR Dashboard
│  └─ Payroll
│
└─ Administration [▼]
   ├─ Users
   └─ Settings
```

---

## 🚀 Step-by-Step Access

### From Sidebar (Desktop/Tablet)
```
1. Look for "Procurement" section in sidebar
2. Click to expand (shows arrow ▼)
3. Two options appear:
   ├─ Suppliers       → Click to go to /suppliers
   └─ Purchase Orders → Click to go to /purchase-orders
```

### From Mobile Menu
```
1. Click hamburger menu icon (☰)
2. Scroll to "Procurement"
3. Tap to expand section
4. Tap on "Suppliers" or "Purchase Orders"
```

### Direct URL Entry
```
Type in address bar:
- http://localhost:3000/suppliers
- http://localhost:3000/purchase-orders
```

---

## 📊 Page Layouts

### Suppliers Page (`/suppliers`)

```
┌─────────────────────────────────────────────────────┐
│  Supplier Management                                │
│  Manage suppliers and track supplier information    │
└─────────────────────────────────────────────────────┘

┌────────────────┬────────────────┬────────────────┬────────────────┐
│ Total          │ Active         │ Manufacturers  │ Distributors   │
│ Suppliers      │ Suppliers      │                │                │
│   12           │   10           │   5            │   3            │
└────────────────┴────────────────┴────────────────┴────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                   Suppliers Table                                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Name | Contact | Email | Phone | Type | Status | Orders | ✏️│  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ Fresh Farms | John | john@ | ... | Mfg | Active | 5 | ✏️ 🗑│  │
│  │ Green Foods | Sarah| sarah@| ... | Whol| Inact  | 2 | ✏️ 🗑│  │
│  │ ... more rows ...                                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  [+ Add Supplier]  [Search...] [Filter by Status] [Filter by Type]│
└─────────────────────────────────────────────────────────────────────┘
```

### Purchase Orders Page (`/purchase-orders`)

```
┌─────────────────────────────────────────────────────┐
│  Purchase Orders                                    │
│  Create and manage purchase orders from suppliers   │
└─────────────────────────────────────────────────────┘

┌────────────────┬────────────┬────────────┬────────────┐
│ Total Orders   │ Pending    │ Partial    │ Received   │
│    45          │   12       │   8        │   25       │
└────────────────┴────────────┴────────────┴────────────┘

┌─────────────────────────────────────────────────────┐
│ Total Order Value          Average Order Value      │
│     $ 45,250.00                   $ 1,005.55        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                  Purchase Orders Table                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Order # | Supplier | Date | Amount | Items | Status | Expected│ │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ PO-2024 | Fresh ... | 12/2 | $500  | 3     | Pending| 12/31 │✏️ │
│  │ PO-2025 | Green ... | 12/2 | $750  | 5     | Partial| 1/5  │✏️ │
│  │ ... more rows ...                                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  [+ Create Order] [Search...] [Filter by Status] [Filter by Supplier]
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Access Control

### Who Can Access?
| User Type | Access |
|-----------|--------|
| Admin | ✅ Full Access to Both |
| Manager | ✅ Full Access to Both |
| User | ❌ No Access |
| Cashier | ❌ No Access |

### What Can They Do?

#### Suppliers
- ✅ View all suppliers (list, search, filter)
- ✅ Create new supplier
- ✅ Edit supplier details
- ✅ Delete supplier (if no active POs)
- ✅ View supplier statistics

#### Purchase Orders
- ✅ View all purchase orders
- ✅ Create new purchase order
- ✅ Receive items (update inventory)
- ✅ Cancel orders (if pending/partial)
- ✅ View full order details

---

## 🔧 Technical Details

### Sidebar Configuration

**File Modified**: `components/sidebar.jsx`

**Changes**:
1. Added Truck icon import
2. Added Procurement section to menuGroups array:
```javascript
{
  key: "procurement",
  label: "Procurement",
  icon: Truck,
  collapsible: true,
  items: [
    { href: "/suppliers", label: "Suppliers", icon: Truck, roles: ["admin", "manager"] },
    { href: "/purchase-orders", label: "Purchase Orders", icon: ShoppingCart, roles: ["admin", "manager"] },
  ]
}
```

### Page Routes

**New Pages Created**:
- `/app/(app)/suppliers/page.jsx` - Suppliers management
- `/app/(app)/purchase-orders/page.jsx` - Purchase orders management

**Components Used**:
- `SuppliersTable` - Full suppliers CRUD interface
- `PurchaseOrdersTable` - Full POs CRUD interface
- `Card` components for statistics

---

## ✨ Features at a Glance

### On Suppliers Page
- 📊 Quick stats (total, active, by type)
- 🔍 Search by name, email, phone, city
- 🏷️ Filter by status and supplier type
- 👁️ View detailed supplier info with stats
- ➕ Create new supplier
- ✏️ Edit supplier details
- 🗑️ Delete supplier
- 📈 View supplier performance metrics

### On Purchase Orders Page
- 📊 Quick stats (total, pending, partial, received, value)
- 💰 Calculate average order value
- 🔍 Search by order number or supplier
- 🏷️ Filter by status and supplier
- 📅 Date range filtering
- ➕ Create new purchase order
- 📦 Receive items with inventory update
- ✏️ Update delivery dates
- 🗑️ Cancel orders
- 👁️ View full order with items

---

## 🎯 Common Tasks

### Create a Supplier
1. Go to Suppliers page (Sidebar → Procurement → Suppliers)
2. Click "+ Add Supplier"
3. Fill in details (name, contact, address, payment terms)
4. Click "Add Supplier"

### Create a Purchase Order
1. Go to Purchase Orders (Sidebar → Procurement → Purchase Orders)
2. Click "+ Create Order"
3. Select supplier
4. Add items (product, quantity, cost)
5. Click "Create Purchase Order"

### Receive Items
1. Go to Purchase Orders
2. Click "View" on pending order
3. Go to "Items" tab
4. Enter quantity to receive
5. Click "Receive Items"
6. Inventory automatically updates!

### Update Supplier Info
1. Go to Suppliers page
2. Click pencil icon (✏️) next to supplier
3. Update information
4. Click "Update Supplier"

---

## 🎨 Color Indicators

### Purchase Order Status
- 🟡 **Pending** (yellow) - Not yet received
- 🔵 **Partial** (blue) - Partially received
- 🟢 **Received** (green) - Fully received
- 🔴 **Cancelled** (red) - Cancelled order

### Supplier Status
- 🟢 **Active** - Currently working with supplier
- ⚪ **Inactive** - Not using supplier

---

## 💡 Pro Tips

1. **Search is powerful**: Works across multiple fields
2. **Batch operations**: Select multiple items for bulk actions
3. **Auto-save**: All changes saved automatically
4. **Inventory sync**: Receiving items auto-updates stock
5. **Price tracking**: Purchase price updates product buying_price

---

## ❓ Troubleshooting

### Can't see Procurement in sidebar?
- Check your role (must be Admin or Manager)
- Refresh the page
- Clear browser cache

### Can't delete a supplier?
- It may have active purchase orders
- Complete or cancel those orders first

### Purchase order not appearing?
- Refresh the page
- Check the status filter isn't hiding it
- Verify supplier was created first

### Inventory not updating?
- Make sure you click "Receive Items" button
- Check that quantities are valid
- Verify the PO status is not "cancelled"

---

**Created**: December 24, 2025  
**Status**: ✅ Ready to Use
