# Product Returns Feature

This document explains the product returns system implementation.

## Overview

The returns system allows you to process product returns, manage refunds, update inventory, and track return statistics. It integrates with the sales, inventory, and loyalty systems.

## Database Setup

### 1. Run the Migration

Execute the migration script to create the necessary database tables:

```bash
node scripts/migrate-returns.js
```

This will create:
- `product_returns` table - stores all return records
- `return_status` column in `sales` table - tracks return status (none/partial/full)
- Necessary indexes for performance

### 2. Table Structure

**product_returns table:**
- `id` - Primary key
- `sale_id` - Reference to original sale
- `product_id` - Reference to product
- `product_name` - Product name (denormalized for history)
- `quantity_returned` - Number of items returned
- `original_quantity` - Original quantity sold
- `return_reason` - Reason for return
- `refund_amount` - Amount refunded
- `restocked` - Whether items were added back to inventory
- `return_date` - When the return was processed
- `processed_by` - User who processed the return

## Features

### 1. Process Returns

**Endpoint:** `POST /api/returns`

**Request Body:**
```json
{
  "sale_id": 123,
  "product_id": 45,
  "quantity_returned": 2,
  "return_reason": "Defective product",
  "restocked": true
}
```

**Response:**
```json
{
  "message": "Return processed successfully",
  "return": { /* return record */ },
  "refund_amount": 50.00
}
```

**Business Logic:**
1. Validates return eligibility
2. Checks quantity limits
3. Calculates proportional refund
4. Updates product inventory (if restocked)
5. Adjusts sale profit
6. Updates sale return status
7. Deducts loyalty points (if applicable)

### 2. View Returns

**Endpoint:** `GET /api/returns`

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `start_date` - Filter by start date
- `end_date` - Filter by end date
- `stats` - Set to 'true' to get statistics only

**Pages:**
- `/returns` - View all returns with statistics

### 3. Check Return Eligibility

**Endpoint:** `GET /api/returns?check_eligibility=true&sale_id=123&product_id=45`

**Response:**
```json
{
  "eligible": true,
  "sale": { /* sale details */ },
  "remainingQuantity": 3,
  "maxRefundAmount": 75.00
}
```

### 4. Get Statistics

**Endpoint:** `GET /api/returns?stats=true&days=30`

**Response:**
```json
{
  "total_returns": 25,
  "total_items_returned": 50,
  "total_refund_amount": 1250.00,
  "avg_refund_amount": 50.00,
  "unique_sales_returned": 20,
  "top_reasons": [
    {
      "return_reason": "Defective",
      "count": 10,
      "total_refund": 500.00
    }
  ]
}
```

## UI Components

### 1. Process Return Modal

Located in `components/process-return-modal.jsx`

**Features:**
- Checks return eligibility automatically
- Shows remaining returnable quantity
- Calculates refund amount in real-time
- Option to restock or not
- Return reason input

**Usage:**
```jsx
import ProcessReturnModal from '@/components/process-return-modal'

<ProcessReturnModal
  isOpen={modalOpen}
  onClose={() => setModalOpen(false)}
  sale={selectedSale}
  onSuccess={() => {
    // Refresh data
  }}
/>
```

### 2. Returns Management Page

Located in `app/(app)/returns/page.jsx`

**Features:**
- Statistics dashboard
- Returns history table
- Search and filter
- Pagination
- Top return reasons

### 3. Sales Page Integration

The sales page now includes:
- Return status badge for each sale
- Return button to process returns
- Disabled for fully returned items

## Return Logic

### Partial vs Full Returns

- **Partial Return:** Some items returned, sale can still be returned again
- **Full Return:** All items returned, no more returns allowed

### Stock Management

When `restocked: true`:
- Adds quantity back to `products.available_quantity`
- Subtracts from `products.sold_quantity`

When `restocked: false`:
- No inventory changes
- Use for damaged/defective items

### Profit Adjustment

Reduces `sales.total_profit` by:
```
quantity_returned × profit_per_unit
```

### Loyalty Points

If the sale had a customer:
- Deducts points equal to refund amount (rounded down)
- Creates adjustment transaction in `loyalty_transactions`
- Never goes below 0 points

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/returns` | Process a new return |
| GET | `/api/returns` | List all returns (paginated) |
| GET | `/api/returns?stats=true` | Get return statistics |
| GET | `/api/returns?check_eligibility=true` | Check if item is returnable |
| GET | `/api/returns/[id]` | Get specific return details |

## Error Handling

The system handles:
- Invalid sale IDs
- Quantity exceeding available
- Already fully returned items
- Missing required fields
- Database transaction failures (with rollback)

## Security

- Requires authenticated session
- Tracks which user processed each return
- Transaction-based operations (ACID compliant)

## Best Practices

1. **Always check eligibility** before showing return UI
2. **Use transactions** for all return operations
3. **Log return reasons** for analytics
4. **Communicate refund amounts** clearly to users
5. **Track who processed** each return for accountability

## Testing

To test the returns system:

1. Create a test sale
2. Navigate to Sales page
3. Click "Return" button on a sale
4. Fill in return details
5. Verify:
   - Inventory updated
   - Profit adjusted
   - Loyalty points deducted
   - Return status updated

## Future Enhancements

Possible improvements:
- Return time limits (e.g., 30 days)
- Partial refund percentages
- Return approval workflow
- Email notifications
- Return labels/receipts
- Integration with accounting systems
- Batch returns processing

## Support

For issues or questions, check:
1. Database migration ran successfully
2. All required tables exist
3. API endpoints are accessible
4. User has proper permissions
