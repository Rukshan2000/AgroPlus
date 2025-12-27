# Outlet Selection on Login

## Overview
When a user with multiple outlet assignments logs in, they are presented with a modal dialog to select which outlet they want to work with. The selected outlet is stored in localStorage and can be accessed throughout the application.

## Features

✅ **Automatic Detection** - Detects when user has multiple outlets  
✅ **Modal Dialog** - Clean UI with radio button selection  
✅ **LocalStorage Persistence** - Selected outlet persists across page reloads  
✅ **Default Selection** - First outlet automatically selected  
✅ **Outlet Details** - Shows outlet name and location  
✅ **Non-dismissible** - User cannot dismiss without selecting  

## How It Works

### Flow
1. User logs in with correct credentials
2. System checks if user has `outlets` array with more than 1 outlet
3. If yes, fetches outlet details from API
4. Shows `OutletSelectionModal` with radio buttons
5. User selects an outlet
6. Selected outlet stored in localStorage
7. User is redirected to dashboard/POS

### Data Storage
Selected outlet is stored in localStorage with two keys:
```javascript
localStorage.selectedOutlet      // Outlet ID (integer)
localStorage.selectedOutletName  // Outlet name (string)
```

## Components

### OutletSelectionModal
**Location**: `components/outlet-selection-modal.jsx`

**Props**:
```javascript
{
  outlets: [              // Array of outlet objects
    {
      id: number,
      name: string,
      location: string
    }
  ],
  onOutletSelected: (outletId: number) => void
}
```

**Features**:
- RadioGroup for outlet selection
- Shows outlet name and location
- Stores selection in localStorage
- Default selection (first outlet)
- Prevents modal dismissal

### Updated AuthForm
**Location**: `components/auth-form.jsx`

**Changes**:
- Imports OutletSelectionModal
- Checks user.outlets array after login
- Fetches outlet details from `/api/outlets?action=active`
- Filters to only show outlets user is assigned to
- Shows modal if multiple outlets exist
- Stores selected outlet before redirect

## Hooks

### useSelectedOutlet()
**Location**: `hooks/use-selected-outlet.js`

**Usage**:
```javascript
import { useSelectedOutlet } from "@/hooks/use-selected-outlet"

export default function MyComponent() {
  const { outletId, outletName, isLoading } = useSelectedOutlet()
  
  if (isLoading) return <div>Loading...</div>
  
  return <div>Working with: {outletName} (ID: {outletId})</div>
}
```

**Returns**:
```javascript
{
  outletId: number | null,      // Selected outlet ID
  outletName: string | null,    // Selected outlet name
  isLoading: boolean            // Loading state
}
```

### setSelectedOutlet(outletId, outletName)
**Usage**:
```javascript
import { setSelectedOutlet } from "@/hooks/use-selected-outlet"

setSelectedOutlet(1, "Main Store")
```

### clearSelectedOutlet()
**Usage**:
```javascript
import { clearSelectedOutlet } from "@/hooks/use-selected-outlet"

// On logout
clearSelectedOutlet()
```

## API Integration

### Fetch Active Outlets
Called during login to get outlet details:
```
GET /api/outlets?action=active
Response: { outlets: [{id, name, location}, ...] }
```

The system then filters this to only show outlets the user is assigned to.

## User Experience

### Single Outlet Users
- Login proceeds normally
- No modal shown
- Redirected directly to dashboard/POS

### Multiple Outlet Users
- Login succeeds
- Modal appears immediately
- Must select outlet to continue
- Modal cannot be dismissed without selection
- Selection stored for session

### UI Flow
```
Login Screen
    ↓
Enter Credentials
    ↓
Validate & Check Outlets
    ↓
Multiple Outlets? → No → Redirect to Dashboard/POS
    ↓
   Yes
    ↓
Show Outlet Selection Modal
    ↓
User Selects Outlet
    ↓
Store in localStorage
    ↓
Redirect to Dashboard/POS
```

## Example Implementation

### Getting Selected Outlet in a Component
```jsx
"use client"

import { useSelectedOutlet } from "@/hooks/use-selected-outlet"

export default function SalesPage() {
  const { outletId, outletName, isLoading } = useSelectedOutlet()

  if (isLoading) {
    return <div>Loading outlet information...</div>
  }

  return (
    <div>
      <h1>Sales - {outletName}</h1>
      <p>Outlet ID: {outletId}</p>
      {/* Use outletId for API calls */}
    </div>
  )
}
```

### Using Outlet in API Calls
```javascript
const { outletId } = useSelectedOutlet()

// Filter sales by outlet
const res = await fetch(`/api/sales?outletId=${outletId}`)

// Or include in request body
const res = await fetch('/api/sales', {
  method: 'POST',
  body: JSON.stringify({
    outletId,
    // other data
  })
})
```

### Clearing on Logout
```javascript
import { clearSelectedOutlet } from "@/hooks/use-selected-outlet"

async function handleLogout() {
  // Call logout API
  await fetch('/api/auth/logout', { method: 'POST' })
  
  // Clear selected outlet
  clearSelectedOutlet()
  
  // Redirect to login
  router.push('/login')
}
```

## Database Considerations

The outlet filtering works like this:
```javascript
// User has outlets: [1, 2, 3]
// Available outlets from API: [1, 2, 3, 4, 5, 6]

// Show only:
const userOutlets = availableOutlets.filter(o => 
  user.outlets.includes(o.id)
) // Result: [1, 2, 3]
```

## Future Enhancements

1. **Outlet Switching** - Allow users to switch outlets without relogin
2. **Outlet Remember** - Remember last selected outlet per user
3. **Multi-outlet Access** - Allow working with multiple outlets simultaneously
4. **Outlet Indicator** - Show current outlet in header/sidebar
5. **Outlet Quick Switch** - Add outlet switcher in top navigation

## Troubleshooting

### Modal Not Showing
- Check user has multiple outlets: `user.outlets.length > 1`
- Verify outlets API is working
- Check browser console for errors

### LocalStorage Not Working
- Check browser allows localStorage
- Verify `use-selected-outlet` hook is client component
- Check DevTools Application tab

### Wrong Outlet Selected
- Default selection picks first outlet only
- User can reselect on each login
- Implement switch feature for mid-session change

## Security Notes

- Outlet selection stored in localStorage (client-side)
- Use outletId from localStorage for API filtering
- Always validate on backend that user can access the outlet
- Don't trust client-side outlet selection for sensitive operations
