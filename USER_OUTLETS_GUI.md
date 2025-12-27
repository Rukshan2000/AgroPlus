# User Outlets GUI Implementation

## Overview
The GUI has been updated to allow users to be assigned to multiple outlets during creation and through a dedicated edit dialog.

## Components Updated

### 1. add-user-modal.jsx
**Changes:**
- Added outlet selection UI during user creation
- Fetches active outlets from `/api/outlets?action=active`
- Multi-checkbox interface for selecting multiple outlets
- Shows count of selected outlets
- Outlets are assigned when user is created

**Features:**
- Outlets list loads when modal opens
- Checkbox selection for each outlet
- Visual feedback showing number of selected outlets
- Empty state handling when no outlets available
- Scrollable outlet list if many outlets exist

**UI Elements:**
- Checkbox for each outlet
- Outlet name display
- Selection counter

### 2. users-table.jsx
**Changes:**
- Added "Outlets" column to user list
- Shows badge with outlet count (e.g., "3 outlet(s)")
- Added "Edit Outlets" button with pencil icon
- Better grid layout to accommodate new column
- Integration with new EditUserOutletsModal component

**Features:**
- Visual badge showing number of outlets assigned
- Quick edit access for outlet assignments
- Maintains existing role update functionality
- Responsive layout

**Column Order:**
1. Email
2. Name
3. Role
4. Outlets (NEW)
5. Actions

### 3. edit-user-outlets-modal.jsx (NEW)
**Purpose:** Edit outlet assignments for existing users

**Features:**
- Modal dialog for outlet management
- Displays user email and name
- Checkbox-based outlet selection
- Shows outlet location if available
- Scrollable outlet list
- Selection counter
- Error handling with alert display
- Loading states for API calls

**API Integration:**
- Fetches outlets: `GET /api/outlets?action=active`
- Updates outlets: `PUT /api/users/{userId}/outlets`
- CSRF protection on all operations

**User Experience:**
- Clear header showing which user is being edited
- Location information shown for each outlet
- Selection feedback
- Error messages displayed in alert
- Loading indicators during API calls

## Data Flow

### Creating a User with Outlets
1. User opens "Add User" modal
2. Modal fetches active outlets on open
3. User enters user details and selects outlets via checkboxes
4. User clicks "Create User"
5. API receives user data with outlets array
6. User created with outlets assigned in single operation

### Editing User Outlets
1. User clicks pencil icon next to user in table
2. EditUserOutletsModal opens with user's current outlets checked
3. User modifies outlet selections
4. User clicks "Save Changes"
5. API updates outlets via `PUT /api/users/{userId}/outlets`
6. Table refreshes with new outlet count

## API Endpoints Used

### Fetch Active Outlets
```
GET /api/outlets?action=active
Response: { outlets: [{ id, name, location }, ...] }
```

### Create User with Outlets
```
POST /api/auth/register
Body: {
  email,
  password,
  name,
  role,
  outlets: [1, 2, 3]  // NEW FIELD
}
```

### Update User Outlets
```
PUT /api/users/{userId}/outlets
Body: { outlets: [1, 2, 3] }
Response: { user: {..., outlets: [1, 2, 3]} }
```

## Key Features

✅ **Multi-outlet assignment** during user creation  
✅ **Edit existing outlet assignments** via dedicated modal  
✅ **Visual indicators** showing outlet count  
✅ **Location information** displayed for each outlet  
✅ **Error handling** with user feedback  
✅ **CSRF protection** on all operations  
✅ **Loading states** for better UX  
✅ **Scrollable lists** for many outlets  
✅ **Selection feedback** showing count  

## Usage

### Add User with Outlets
1. Click "Add User" button
2. Fill in user details (name, email, password, role)
3. Scroll down to "Assign Outlets" section
4. Check outlets you want to assign
5. Click "Create User"

### Edit User Outlets
1. Find user in the table
2. Click the pencil icon in the "Actions" column
3. Check/uncheck outlets in the modal
4. Click "Save Changes"

## Component Props

### EditUserOutletsModal
```javascript
{
  isOpen: boolean,           // Whether modal is open
  onClose: () => void,       // Called when modal closes
  user: {                    // User object
    id: number,
    email: string,
    name: string,
    outlets: number[]        // Current outlet IDs
  },
  onSuccess: (user) => void  // Called when outlets updated
}
```

## Styling

All components use:
- Shadcn UI components (Dialog, Button, Checkbox, Label, etc.)
- Consistent styling with rest of application
- Responsive design
- Accessibility features (proper labels, ARIA attributes)

## Database Integration

The outlets data comes from the `outlets` table:
- Fields used: `id`, `name`, `location`
- User outlets stored in: `users.outlets` (JSONB column)
- Filters applied: `is_active = true` for dropdown lists

## Future Enhancements

Possible improvements:
1. **Outlet Groups:** Group outlets by location/region
2. **Outlet Templates:** Save common outlet combinations
3. **Bulk Assignment:** Assign multiple users to outlets at once
4. **Outlet Filtering:** Filter users by assigned outlets
5. **Dashboard Filtering:** Show outlet-specific data based on user assignments
