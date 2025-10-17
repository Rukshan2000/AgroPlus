# Sales API 500 Error Fix

## Issue
The `/api/sales` endpoint was returning a 500 Internal Server Error with the message "Failed to fetch sales data".

## Root Cause
The SQL queries in `models/salesModel.js` and `models/returnModel.js` were attempting to select `u.username` from the users table, but the users table schema uses `name` instead of `username`.

### Error Details
- **Error**: `column u.username does not exist`
- **Affected Files**: 
  - `models/salesModel.js`
  - `models/returnModel.js`

## Files Fixed

### 1. models/salesModel.js
Changed `u.username` to `u.name` in the following functions:
- `listSales()` - Line ~68
- `getSaleById()` - Line ~95
- `getCashierPerformance()` - Lines ~239, ~250

### 2. models/returnModel.js
Changed `u.username` to `u.name` in the following functions:
- `getReturnsBySale()` - Line ~122
- `listReturns()` - Line ~159
- `getReturnById()` - Line ~228

### 3. scripts/test-sales-query.js
Updated test script to use `u.name` instead of `u.username`

## Verification
The fix was verified by:
1. Checking the users table schema (confirmed it has `name`, not `username`)
2. Running a test query directly against the database
3. Restarting the development server

## Database Schema Reference

### Users Table Columns
- id
- email
- password_hash
- **name** ← correct column
- role
- theme_preference
- created_at
- updated_at

### Sales Table Columns
- id
- product_id
- product_name
- quantity
- unit_price
- original_price
- discount_percentage
- discount_amount
- total_amount
- sale_date
- created_by
- created_at
- updated_at
- buying_price_at_sale
- profit_per_unit
- total_profit
- profit_margin_percentage
- customer_id
- return_status

## Result
The `/api/sales` endpoint now works correctly and returns sales data without errors.
