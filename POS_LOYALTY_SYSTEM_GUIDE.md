# POS Loyalty System Implementation Guide

## Overview
This document describes the complete loyalty system implementation for the POS (Point of Sale) system, allowing cashiers to issue loyalty cards, manage customer rewards, and process redemptions at checkout.

## Features Implemented

### 1. **Loyalty Card Issuance**
Cashiers can quickly issue loyalty cards to new customers directly from the POS screen.

#### Components:
- **Quick Customer Registration Modal** (`components/pos/quick-customer-registration.jsx`)
  - Fast customer enrollment optimized for checkout flow
  - Automatic loyalty program assignment
  - Instant signup bonus crediting
  - Visual loyalty card display with card number
  - Printable card design

#### Card Number Format:
- Format: `LC-XXXX-XXXX` (e.g., `LC-0000-0001`)
- Automatically generated via database trigger
- Unique identifier for each customer
- Searchable in customer lookup

### 2. **Customer Loyalty Management**
Integrated customer search and selection at POS.

#### Components:
- **Customer Loyalty Component** (`components/pos/customer-loyalty.jsx`)
  - Customer search by name, phone, email, or card number
  - Display current customer with points balance
  - Quick access to issue new loyalty cards
  - Shows active loyalty program details

#### Features:
- Real-time customer search
- Display customer points balance
- Show loyalty program membership
- Easy customer removal from transaction

### 3. **Reward Redemption**
Customers can redeem accumulated points for rewards during checkout.

#### Components:
- **Reward Redemption Component** (`components/pos/reward-redemption.jsx`)
  - Browse available rewards
  - Filter by customer's point balance
  - Apply discount rewards to cart
  - Issue item rewards for pickup

#### Reward Types:
1. **Discount Rewards**
   - Percentage discount (e.g., 10% off)
   - Fixed amount discount (e.g., LKR 500 off)
   - Minimum purchase requirements
   - Applied directly to cart total

2. **Item Rewards**
   - Physical items/gifts
   - Stock quantity tracking
   - Redemption history

### 4. **Points System**
Automatic points calculation and awarding on sales.

#### Points Earning:
- Points earned based on loyalty program settings
- Configurable earn rate (e.g., 1 point per LKR)
- Points awarded on total after reward discount
- Exclude tax from points calculation
- Signup bonus automatically credited

#### Points Redemption:
- Points deducted on reward redemption
- Transaction recorded in loyalty history
- Stock quantities updated for item rewards
- Redemption validation before checkout

### 5. **POS Integration**

#### Layout:
```
┌─────────────────────────────────┬───────────────┐
│     Product Input & Controls    │               │
├─────────────────────────────────┤     Cart      │
│                                 │               │
│        Product Grid             │   Totals      │
│                                 │               │
├──────────────┬──────────────────┤   Checkout    │
│  Customer    │     Rewards      │               │
│  Loyalty     │   Redemption     │               │
└──────────────┴──────────────────┴───────────────┘
```

#### Customer Flow:
1. Search/select customer OR issue new loyalty card
2. Add products to cart
3. (Optional) Apply reward redemption
4. Complete sale
5. Points automatically awarded

## Database Schema

### Customers Table (Enhanced)
```sql
- id (serial primary key)
- first_name (varchar)
- last_name (varchar)
- email (varchar, unique)
- phone (varchar)
- loyalty_card_number (varchar, unique) ← NEW
- loyalty_program_id (foreign key)
- points_balance (integer)
- total_points_earned (integer)
- total_points_redeemed (integer)
- join_date (timestamp)
- last_activity (timestamp)
```

### Key Tables:
- `loyalty_programs` - Program configurations
- `customers` - Customer information with loyalty cards
- `loyalty_transactions` - Points earn/redeem history
- `rewards` - Available rewards catalog
- `redemptions` - Reward redemption records

## API Endpoints

### Customer Management
- `GET /api/customers?search={term}` - Search customers (includes card number)
- `POST /api/customers` - Create customer with auto card number
- `GET /api/customers/:id` - Get customer details

### Loyalty Programs
- `GET /api/loyalty?active=true` - Get active programs
- `GET /api/loyalty/:id` - Get program details

### Rewards
- `GET /api/rewards?active=true` - Get active rewards
- `POST /api/rewards/:id/redeem` - Redeem reward for customer

### Sales (Enhanced)
- `POST /api/sales` - Process sale with loyalty
  - Accepts `customer_id` for points
  - Accepts `reward_id` for redemptions
  - Calculates and awards points automatically
  - Deducts points for reward redemptions

## Usage Guide for Cashiers

### Issuing a Loyalty Card

1. **Click "Issue Loyalty Card"** button in Customer Loyalty section
2. **Enter customer details**:
   - First Name (required)
   - Last Name (required)
   - Phone Number (required)
   - Email (optional)
3. **Submit** - Customer is created instantly
4. **Card displayed** with:
   - Unique card number
   - Welcome bonus points
   - Customer information
5. **Options**:
   - Print card for customer
   - Use customer for current transaction

### Processing a Sale with Loyalty

1. **Select/Create Customer**:
   - Search by name, phone, or card number
   - OR issue new loyalty card
   
2. **Add Products** to cart as normal

3. **Apply Reward** (optional):
   - Browse available rewards
   - Check points balance
   - Select reward to apply
   - Discount automatically applied

4. **Complete Sale**:
   - Review total with any reward discount
   - Process payment
   - Points automatically awarded
   - Receipt shows points earned/redeemed

### Redeeming Rewards

1. **Customer must be selected**
2. **View available rewards** in Rewards section
3. **Eligible rewards** highlighted (sufficient points + min purchase met)
4. **Click reward** to apply
5. **Confirm redemption**:
   - Shows points cost
   - Shows new balance after redemption
   - Shows discount value
6. **Reward applied** to cart
7. **Complete sale** to finalize redemption

## Configuration

### Loyalty Program Settings
Configure in admin panel (`/rewards` page):
- Points per LKR earned
- Signup bonus points
- Minimum redemption threshold
- Program activation

### Rewards Catalog
Manage rewards (`/rewards` page):
- Create discount or item rewards
- Set points cost
- Configure minimum purchase amounts
- Manage stock quantities
- Activate/deactivate rewards

## Technical Details

### Sales Processing Flow
```javascript
1. Validate cart items and stock
2. If customer selected:
   - Verify customer exists
   - If reward applied:
     * Validate reward availability
     * Check customer points balance
     * Calculate discount
     * Deduct points from customer
3. Create sale records
4. Update product stock
5. If customer selected:
   - Calculate points earned (based on final total)
   - Add points to customer balance
   - Record loyalty transaction
6. If reward redeemed:
   - Update reward stock (if applicable)
   - Record redemption
7. Commit transaction
```

### Customer Creation Flow
```javascript
1. Validate customer data
2. Check for duplicates (email/phone)
3. Assign default loyalty program
4. Insert customer record
5. Database trigger generates card number
6. If signup bonus configured:
   - Add bonus points
   - Record transaction
7. Return customer with card number
```

## Database Migration

Run the migration to add loyalty card numbers:
```bash
psql -U postgres -d saas -f scripts/sql/add-loyalty-card-number.sql
```

This migration:
- Adds `loyalty_card_number` column
- Creates unique index for fast lookups
- Generates card numbers for existing customers
- Sets up triggers for automatic card number generation
- Updates search functionality to include card numbers

## Security Considerations

1. **CSRF Protection**: All mutations require CSRF token
2. **Role-Based Access**: Cashiers can create customers and redeem rewards
3. **Transaction Safety**: Database transactions ensure consistency
4. **Validation**: Points balance checked before redemption
5. **Stock Control**: Reward stock validated before redemption

## Future Enhancements

### Potential Features:
- QR code on loyalty cards for faster lookup
- SMS/Email notifications for points earned
- Tier-based loyalty programs (Bronze/Silver/Gold)
- Expiring points/rewards
- Birthday bonuses
- Referral rewards
- Mobile app integration
- Customer purchase history in POS
- Loyalty reports and analytics
- Bulk points adjustment (admin)

## Troubleshooting

### Customer Can't Be Found
- Verify phone number format
- Try searching by card number
- Check if customer exists in database
- Ensure search term has at least 2 characters

### Reward Can't Be Redeemed
- Check customer points balance
- Verify reward is active
- Check stock quantity
- Verify minimum purchase amount met
- Ensure reward hasn't expired

### Points Not Awarded
- Verify customer selected before checkout
- Check loyalty program is active
- Verify points_per_lkr configuration (displayed as "Points per LKR" in UI)
- Check transaction logs

### Card Number Not Generated
- Verify migration was run successfully
- Check database triggers are active
- Manually run card number generation function
- Check customer record in database

## Support

For issues or questions:
1. Check this documentation
2. Review error logs
3. Verify database migrations
4. Contact system administrator

---

**Last Updated**: October 18, 2025  
**Version**: 1.0  
**Branch**: royality-update
