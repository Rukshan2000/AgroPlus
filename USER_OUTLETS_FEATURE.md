# User Outlets Assignment Feature

## Overview
Users can now be assigned to multiple outlets using a JSON array stored in the `outlets` column of the users table.

## Database Changes

### New Column Added
```sql
ALTER TABLE users ADD COLUMN outlets JSONB DEFAULT '[]'::jsonb;
```

### Structure
- **Column Name**: `outlets`
- **Type**: JSONB (JSON)
- **Default**: Empty array `[]`
- **Storage**: Array of outlet IDs

Example data:
```json
{
  "outlets": [1, 3, 5]
}
```

## Model Updates

### userModel.js
New functions and updated functions:

#### `updateUserOutlets(id, outlets)`
Updates a user's assigned outlets.

```javascript
// Usage
const updated = await updateUserOutlets(1, [1, 2, 3])
```

#### Updated Functions
- `findUserById()` - Now returns outlets field
- `createUser()` - Accepts outlets parameter
- `listUsers()` - Now returns outlets for each user
- `updateUserRole()` - Returns outlets field
- `updateUserTheme()` - Returns outlets field

## API Endpoints

### Update User Outlets
**Endpoint**: `PUT /api/users/[id]/outlets`

**Authentication**: Required (admin/manager only)

**Request Body**:
```json
{
  "outlets": [1, 2, 3]
}
```

**Response**:
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "cashier",
    "outlets": [1, 2, 3],
    "theme_preference": "light"
  }
}
```

## Frontend Implementation

### Example: Update User Outlets
```javascript
async function assignOutletsToUser(userId, outletIds) {
  const csrf = await fetch("/api/auth/csrf")
    .then((r) => r.json())
    .then((d) => d.csrfToken)

  const res = await fetch(`/api/users/${userId}/outlets`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrf
    },
    body: JSON.stringify({ outlets: outletIds })
  })

  if (res.ok) {
    const data = await res.json()
    return data.user
  }
  
  throw new Error("Failed to update outlets")
}
```

## Usage Examples

### Assign multiple outlets to a user
```bash
curl -X PUT http://localhost:3000/api/users/5/outlets \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_TOKEN" \
  -d '{"outlets": [1, 2, 3]}'
```

### Assign single outlet
```bash
curl -X PUT http://localhost:3000/api/users/5/outlets \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_TOKEN" \
  -d '{"outlets": [1]}'
```

### Clear all outlet assignments
```bash
curl -X PUT http://localhost:3000/api/users/5/outlets \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_TOKEN" \
  -d '{"outlets": []}'
```

## Access Control
- **Admin**: Can assign outlets to any user
- **Manager**: Can assign outlets to any user
- **User/Cashier**: Cannot assign outlets

## Next Steps

### Suggested Implementations
1. **User Management UI**: Add outlet selection in the add/edit user modal
2. **User List Display**: Show assigned outlets in the users table
3. **Sales Integration**: Restrict sales/transactions to assigned outlets for cashiers
4. **Reporting**: Filter reports by user's assigned outlets
5. **Multi-outlet Dashboard**: Show data only for assigned outlets

### Create MultiSelect Component
You can create a multi-select component for outlet assignment:

```jsx
<MultiSelect
  label="Assign Outlets"
  options={outlets.map(o => ({ value: o.id, label: o.name }))}
  value={selectedOutlets}
  onChange={setSelectedOutlets}
  placeholder="Select outlets..."
/>
```

## Database Query Examples

### Get users assigned to a specific outlet
```sql
SELECT * FROM users WHERE outlets @> '["1"]'::jsonb;
```

### Get all users with outlet assignments
```sql
SELECT * FROM users WHERE outlets <> '[]'::jsonb;
```

### Count outlets per user
```sql
SELECT id, email, jsonb_array_length(outlets) as outlet_count FROM users;
```

## Notes
- Empty outlets array `[]` means user has no outlet restrictions
- All outlet IDs must be valid integers
- CSRF protection is enabled on all outlet update operations
- Changes are logged with `updated_at` timestamp
