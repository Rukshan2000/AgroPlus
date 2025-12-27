# Quick Reference: Using Selected Outlet in Components

## Import the Hook

```javascript
import { useSelectedOutlet } from "@/hooks/use-selected-outlet"
```

## Get Selected Outlet

```javascript
const { outletId, outletName, isLoading } = useSelectedOutlet()
```

## Complete Example

```jsx
"use client"

import { useSelectedOutlet } from "@/hooks/use-selected-outlet"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function OutletInfo() {
  const { outletId, outletName, isLoading } = useSelectedOutlet()

  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  if (!outletId) {
    return <div className="p-4">No outlet selected</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Outlet</CardTitle>
      </CardHeader>
      <CardContent>
        <p><strong>Name:</strong> {outletName}</p>
        <p><strong>ID:</strong> {outletId}</p>
      </CardContent>
    </Card>
  )
}
```

## Use in API Calls

### Query Parameter
```javascript
const { outletId } = useSelectedOutlet()

const res = await fetch(`/api/sales?outletId=${outletId}`)
```

### Request Body
```javascript
const { outletId } = useSelectedOutlet()

const res = await fetch('/api/sales', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': csrf
  },
  body: JSON.stringify({
    outletId,
    amount: 100,
    items: [...]
  })
})
```

## Filter Data by Outlet

```javascript
const { outletId } = useSelectedOutlet()
const [sales, setSales] = useState([])

useEffect(() => {
  fetchSalesByOutlet()
}, [outletId])

async function fetchSalesByOutlet() {
  const res = await fetch(`/api/sales?outletId=${outletId}`)
  const data = await res.json()
  setSales(data.sales)
}
```

## Show Outlet Name in Header

```jsx
const { outletName } = useSelectedOutlet()

return (
  <div className="p-4 bg-blue-50 rounded">
    <p className="text-sm text-muted-foreground">Current Outlet</p>
    <p className="text-lg font-semibold">{outletName}</p>
  </div>
)
```

## Common Patterns

### Conditional Rendering Based on Outlet
```javascript
const { outletId, isLoading } = useSelectedOutlet()

if (isLoading) return <Skeleton />
if (!outletId) return <div>No outlet selected. Please login again.</div>

// Render component with outlet-specific data
return <SalesComponent outletId={outletId} />
```

### Pass Outlet to Child Component
```javascript
const { outletId } = useSelectedOutlet()

return (
  <div>
    <SalesTable outletId={outletId} />
    <SalesChart outletId={outletId} />
  </div>
)
```

### Use with useEffect Dependency
```javascript
const { outletId, isLoading } = useSelectedOutlet()

useEffect(() => {
  if (!isLoading && outletId) {
    fetchData()
  }
}, [outletId, isLoading])
```

## LocalStorage Direct Access (Not Recommended)

```javascript
// Get values directly (avoid if possible)
const outletId = localStorage.getItem("selectedOutlet")
const outletName = localStorage.getItem("selectedOutletName")

// Set values (use setSelectedOutlet instead)
localStorage.setItem("selectedOutlet", "1")
localStorage.setItem("selectedOutletName", "Main Store")

// Clear values (use clearSelectedOutlet instead)
localStorage.removeItem("selectedOutlet")
localStorage.removeItem("selectedOutletName")
```

## Related Functions

### Set Selected Outlet
```javascript
import { setSelectedOutlet } from "@/hooks/use-selected-outlet"

setSelectedOutlet(1, "Main Store")
```

### Clear Selected Outlet (On Logout)
```javascript
import { clearSelectedOutlet } from "@/hooks/use-selected-outlet"

async function handleLogout() {
  clearSelectedOutlet()
  router.push('/login')
}
```

## Tips

1. **Always check isLoading** before using outletId
2. **Use the hook** instead of accessing localStorage directly
3. **Clear on logout** to prevent data bleeding between users
4. **Validate on backend** that user can access the outlet
5. **Use in dependency arrays** for useEffect hooks
