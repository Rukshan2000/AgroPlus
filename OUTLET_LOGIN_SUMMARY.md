# Outlet Selection on Login - Implementation Summary

## What Was Added

### 1. Outlet Selection Modal Component
**File**: `components/outlet-selection-modal.jsx`

- Modal dialog shown after successful login if user has multiple outlets
- Radio button selection for each outlet
- Shows outlet name and location
- Stores selected outlet in localStorage
- Non-dismissible until selection made
- Auto-selects first outlet as default

### 2. Updated Auth Form
**File**: `components/auth-form.jsx`

- Detects if user has multiple outlets after login
- Fetches outlet details from API
- Shows outlet selection modal
- Waits for user to select outlet before redirect
- Stores selected outlet before proceeding

### 3. Selected Outlet Hook
**File**: `hooks/use-selected-outlet.js`

Three exported functions/hooks:
- `useSelectedOutlet()` - Get current selected outlet
- `setSelectedOutlet(id, name)` - Manually set outlet
- `clearSelectedOutlet()` - Clear on logout

### 4. Documentation
- `OUTLET_SELECTION_LOGIN.md` - Complete feature documentation
- `OUTLET_USAGE_GUIDE.md` - Quick reference for developers

## User Flow

```
┌─────────────────┐
│  Login Form     │
└────────┬────────┘
         │
         ▼
    ┌─────────────────┐
    │ Validate User   │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │ Multiple Outlets?│
    └────┬───────┬────┘
         │       │
        No      Yes
         │       │
         ▼       ▼
    Redirect   ┌──────────────────┐
               │ Show Modal       │
               │ (Radio Buttons)  │
               └────────┬─────────┘
                        │
                        ▼
               ┌──────────────────┐
               │ User Selects     │
               └────────┬─────────┘
                        │
                        ▼
               ┌──────────────────┐
               │ Store in Storage │
               └────────┬─────────┘
                        │
                        ▼
                    Redirect
```

## Data Storage

### LocalStorage Keys
```javascript
localStorage.selectedOutlet      // Outlet ID (e.g., "1")
localStorage.selectedOutletName  // Outlet name (e.g., "Main Store")
```

### Example
After user selects outlet "Main Store" with ID 1:
```javascript
localStorage.getItem("selectedOutlet")      // "1"
localStorage.getItem("selectedOutletName")  // "Main Store"
```

## API Flow

### 1. User Logs In
```
POST /api/auth/login
{email, password} → {user: {..., outlets: [1, 2, 3]}}
```

### 2. Get Outlet Details
```
GET /api/outlets?action=active
→ {outlets: [{id, name, location}, ...]}
```

### 3. Filter User's Outlets
```javascript
const userOutlets = outlets.filter(o => user.outlets.includes(o.id))
```

### 4. Show Modal with User's Outlets

## Component Hierarchy

```
AuthForm
├── OutletSelectionModal
│   ├── RadioGroup
│   ├── RadioGroupItem
│   ├── Label
│   └── Button
└── [Login UI]
```

## Usage in Components

### Get Selected Outlet
```javascript
import { useSelectedOutlet } from "@/hooks/use-selected-outlet"

const { outletId, outletName, isLoading } = useSelectedOutlet()
```

### Use in API Calls
```javascript
const res = await fetch(`/api/sales?outletId=${outletId}`)
```

### Clear on Logout
```javascript
import { clearSelectedOutlet } from "@/hooks/use-selected-outlet"

clearSelectedOutlet()
```

## Key Features

✅ **Automatic Detection** - Checks if user has multiple outlets  
✅ **Clean UI** - Modal with radio buttons  
✅ **Persistent** - Stores selection in localStorage  
✅ **Default** - First outlet pre-selected  
✅ **Non-dismissible** - User must select to continue  
✅ **Details** - Shows outlet name and location  
✅ **Flexible** - Easy to use hook for any component  

## Security Considerations

1. **Backend Validation**: Always validate outlet access on server
2. **User Isolation**: Never trust client-side outlet selection alone
3. **Session-based**: Selection persists only in browser storage
4. **Logout Clearing**: Clear storage on logout

## Next Steps for Integration

### 1. Update API Endpoints
Add `outletId` parameter/validation to existing endpoints:
- `/api/sales` - Filter by outlet
- `/api/inventory` - Filter by outlet
- `/api/returns` - Filter by outlet
- etc.

### 2. Update Components
Use outlet selection in components:
```javascript
const { outletId } = useSelectedOutlet()

// Pass to API calls
const res = await fetch(`/api/sales?outletId=${outletId}`)
```

### 3. Add Logout Handler
Clear outlet on logout:
```javascript
import { clearSelectedOutlet } from "@/hooks/use-selected-outlet"

async function handleLogout() {
  clearSelectedOutlet()
  router.push('/login')
}
```

### 4. Display Current Outlet
Show in header/sidebar where user is working:
```javascript
const { outletName } = useSelectedOutlet()

return <div>Working with: {outletName}</div>
```

## Testing

### Test Scenario 1: Single Outlet User
1. Log in with user having 1 outlet
2. Should skip modal, redirect directly

### Test Scenario 2: Multiple Outlet User
1. Log in with user having 2+ outlets
2. Modal should appear
3. Select an outlet
4. Should redirect to dashboard
5. Check localStorage has selection

### Test Scenario 3: Use Outlet in Component
1. Create test component using `useSelectedOutlet()`
2. Verify outletId and outletName are available
3. Check isLoading flag works correctly

### Test Scenario 4: Logout
1. Clear localStorage after logout
2. Log back in
3. Modal should appear again

## Files Modified/Created

### Created
- `components/outlet-selection-modal.jsx` (94 lines)
- `hooks/use-selected-outlet.js` (46 lines)
- `OUTLET_SELECTION_LOGIN.md` (Documentation)
- `OUTLET_USAGE_GUIDE.md` (Quick reference)

### Modified
- `components/auth-form.jsx` (Added outlet detection and modal)

## Troubleshooting

### Modal Not Showing
- Check user has `outlets` array with length > 1
- Verify `/api/outlets?action=active` returns data
- Check browser console for errors

### Data Not Persisting
- Verify browser allows localStorage
- Check DevTools Application → Local Storage
- Confirm component uses `useSelectedOutlet` hook

### Wrong Outlet Selected
- Modal shows all outlets user is assigned to
- Default is always first outlet
- User can change on each login (for now)

## Future Enhancements

1. **Outlet Switcher** - Allow switching without logout
2. **Last Used** - Remember last selected outlet
3. **Header Display** - Show current outlet in UI
4. **Outlet Filter** - Filter data by outlet across app
5. **Quick Access** - Add outlet switcher in nav
