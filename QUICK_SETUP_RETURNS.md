# Quick Setup Guide - Returns Feature

## Prerequisites
- PostgreSQL database configured
- All dependencies installed (`npm install`)
- Application running

## Setup Steps

### 1. Run Database Migration

Execute the migration script to create the returns tables:

```bash
node scripts/migrate-returns.js
```

You should see:
```
Starting returns table migration...
Executing SQL migration...
✅ Returns table created successfully!
✅ Return status column added to sales table!
✅ Indexes created!

Migration completed successfully!
```

### 2. Verify Database Tables

Check that the tables were created:

```sql
-- Check product_returns table
SELECT * FROM product_returns LIMIT 1;

-- Check return_status column in sales table
SELECT id, return_status FROM sales LIMIT 5;
```

### 3. Test the Feature

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Create a test sale:**
   - Go to `/pos` (POS System)
   - Make a sale with multiple items
   - Note the sale ID

3. **Process a return:**
   - Go to `/sales` (Sales History)
   - Find your test sale
   - Click the "Return" button
   - Enter return details:
     - Quantity to return (must be ≤ original quantity)
     - Return reason (optional)
     - Check/uncheck "Add items back to inventory"
   - Click "Process Return"

4. **View returns:**
   - Go to `/returns` (Returns page)
   - See your return in the list
   - Check the statistics dashboard

### 4. API Testing (Optional)

Test the API endpoints using curl or Postman:

```bash
# Get returns list
curl http://localhost:3000/api/returns

# Get statistics
curl http://localhost:3000/api/returns?stats=true

# Check eligibility
curl "http://localhost:3000/api/returns?check_eligibility=true&sale_id=1&product_id=1"

# Process a return (requires authentication)
curl -X POST http://localhost:3000/api/returns \
  -H "Content-Type: application/json" \
  -d '{
    "sale_id": 1,
    "product_id": 1,
    "quantity_returned": 1,
    "return_reason": "Defective product",
    "restocked": true
  }'
```

## Navigation

The Returns feature is accessible from:
- **Sidebar:** Sales & POS → Returns
- **Sales Page:** Return button on each sale

## Access Control

Returns are available to:
- ✅ Admin
- ✅ Manager
- ✅ User
- ❌ Cashier (read-only access to POS)

## Troubleshooting

### Migration Fails

**Error:** "relation 'sales' does not exist"
- Make sure your main migrations have run first
- Run: `npm run db:migrate`

**Error:** "column 'return_status' already exists"
- Migration already ran successfully
- You can safely ignore or drop and recreate

### API Returns 401 Unauthorized

- Ensure you're logged in
- Check session authentication
- Try logging out and back in

### Return Button Disabled

- Check if sale is already fully returned
- Look at the "Status" column for return status

### Inventory Not Updating

- Verify `restocked: true` is set
- Check product stock before and after
- Look at database logs for errors

### Points Not Deducting

- Ensure sale has a customer associated
- Check if `loyalty_transactions` table exists
- Verify customer has enough points (won't go negative)

## Database Schema Quick Reference

### product_returns table
```sql
Column              | Type         | Description
--------------------|--------------|---------------------------
id                  | SERIAL       | Primary key
sale_id             | INTEGER      | FK to sales.id
product_id          | INTEGER      | FK to products.id
product_name        | VARCHAR(255) | Product name (denormalized)
quantity_returned   | INTEGER      | Number returned
original_quantity   | INTEGER      | Original sale quantity
return_reason       | TEXT         | Why returned
refund_amount       | DECIMAL      | Money refunded
restocked           | BOOLEAN      | Added back to inventory?
return_date         | TIMESTAMP    | When returned
processed_by        | INTEGER      | FK to users.id
created_at          | TIMESTAMP    | Record creation time
```

### sales.return_status
```sql
Values: 'none' | 'partial' | 'full'
Default: 'none'
```

## Key Files

| File | Purpose |
|------|---------|
| `models/returnModel.js` | Database operations |
| `controllers/returnController.js` | Business logic |
| `app/api/returns/route.js` | API endpoints |
| `components/process-return-modal.jsx` | Return UI |
| `app/(app)/returns/page.jsx` | Returns dashboard |
| `scripts/sql/create-returns-table.sql` | Database schema |
| `scripts/migrate-returns.js` | Migration runner |

## What Gets Updated on Return

1. ✅ `product_returns` table - New record created
2. ✅ `products.available_quantity` - Increased (if restocked)
3. ✅ `products.sold_quantity` - Decreased (if restocked)
4. ✅ `sales.total_profit` - Decreased
5. ✅ `sales.return_status` - Updated to 'partial' or 'full'
6. ✅ `customers.points_balance` - Decreased
7. ✅ `loyalty_transactions` - Adjustment record created

## Support

For detailed documentation, see:
- `RETURNS_FEATURE.md` - Complete feature documentation
- `IMPLEMENTATION_SUMMARY.md` - Implementation details

## Next Steps

After successful setup:
1. Test with real sales data
2. Train staff on return process
3. Monitor return statistics
4. Adjust return policies as needed
5. Consider implementing time limits for returns
6. Add return approval workflow if needed

---

**Setup Complete!** 🎉

Your returns system is ready to use. Navigate to `/returns` to see it in action!
