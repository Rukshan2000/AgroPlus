# Outlets Feature Setup

## Overview
The Outlets feature has been successfully created for managing multiple store locations/outlets in your SAAS application.

## Files Created

### 1. Database Model
- **File**: `models/outletModel.js`
- **Functions**:
  - `findOutletById(id)` - Get a single outlet by ID
  - `findOutletByName(name)` - Find outlet by name
  - `createOutlet(data)` - Create a new outlet
  - `listOutlets(options)` - List outlets with pagination and filtering
  - `updateOutlet(id, updates)` - Update outlet details
  - `deleteOutlet(id)` - Delete an outlet
  - `getActiveOutlets()` - Get all active outlets

### 2. Controller
- **File**: `controllers/outletController.js`
- **Endpoints**:
  - `list()` - Get paginated list of outlets
  - `create()` - Create new outlet (admin/manager only)
  - `read()` - Get single outlet details
  - `update()` - Update outlet (admin/manager only)
  - `remove()` - Delete outlet (admin/manager only)
  - `getActive()` - Get active outlets list

### 3. API Routes
- **File**: `app/api/outlets/route.js`
- **Methods**: GET, POST, PUT, DELETE
- **Supports actions**: 
  - `?action=active` - Get active outlets
  - `?action=read&id=1` - Get specific outlet
  - Standard CRUD operations

### 4. Components
- **add-outlet-modal.jsx** - Dialog for adding/editing outlets
  - Form validation
  - Edit mode support
  - CSRF protection
  
- **outlets-table.jsx** - Table component displaying outlets
  - Search functionality
  - Status filtering (active/inactive)
  - Pagination
  - Edit/Delete actions
  - Responsive design

### 5. Page
- **File**: `app/(app)/outlets/page.jsx`
- Route: `/outlets`
- Full outlets management interface

### 6. Database Table
- **Table Name**: `outlets`
- **Columns**:
  - `id` - Primary key
  - `name` - Outlet name (unique)
  - `location` - Location/area name
  - `address` - Full address
  - `phone` - Contact phone number
  - `email` - Contact email
  - `manager` - Manager name
  - `is_active` - Active status (boolean)
  - `created_at` - Creation timestamp
  - `updated_at` - Last update timestamp
  - `created_by` - User who created the outlet

## Features

✅ Create new outlets with full details
✅ Edit existing outlets
✅ Delete outlets with confirmation
✅ Search and filter outlets
✅ Pagination support
✅ Active/inactive status management
✅ Role-based access control (admin/manager only)
✅ CSRF protection on all mutations
✅ Form validation with error messages
✅ Responsive UI design

## Access Control

The Outlets feature is available to:
- **admin** - Full access
- **manager** - Full access

**Not available to**: cashier, user roles

## Usage

### Access the Outlets Page
Navigate to: http://localhost:3000/outlets

### Sidebar Menu
The "Outlets" menu item appears in the sidebar under the main navigation for admin and manager users.

### API Examples

**List outlets:**
```bash
GET /api/outlets
GET /api/outlets?page=1&limit=10&search=Main
GET /api/outlets?action=active
```

**Get specific outlet:**
```bash
GET /api/outlets?action=read&id=1
```

**Create outlet:**
```bash
POST /api/outlets
Content-Type: application/json
X-CSRF-Token: {token}

{
  "name": "Main Store",
  "location": "Downtown",
  "address": "123 Main St",
  "phone": "555-0123",
  "email": "main@example.com",
  "manager": "John Doe",
  "is_active": true
}
```

**Update outlet:**
```bash
PUT /api/outlets?action=update
Content-Type: application/json
X-CSRF-Token: {token}

{
  "id": 1,
  "name": "Main Store",
  "location": "Downtown",
  ...
}
```

**Delete outlet:**
```bash
DELETE /api/outlets
Content-Type: application/json
X-CSRF-Token: {token}

{
  "id": 1
}
```

## Next Steps

You can now:
1. Add outlets through the UI at `/outlets`
2. Integrate outlets with other features (assign sales to outlets, etc.)
3. Use the `getActiveOutlets()` function to populate outlet dropdowns in other features
4. Create outlet-wise reports and analytics

## Notes

- Outlet names are unique in the database
- All write operations require admin or manager role
- CSRF tokens are automatically handled by the modal component
- Form includes validation for email format
- Timestamps are automatically managed
