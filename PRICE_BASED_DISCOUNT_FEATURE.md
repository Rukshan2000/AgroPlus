# Price-Based Discount Feature

## Overview
Added a new feature to apply discounts by **selling price** instead of just percentage. This makes it easier for cashiers who know the final selling price but not the discount percentage.

## How It Works

### Before (Percentage Only)
- Price: 250 PKR
- Discount: 10%
- Final Price: 225 PKR

### Now (Percentage OR Price)
- Price: 250 PKR
- Enter Selling Price: 240 PKR
- System automatically calculates: 4% discount
- Final Price: 240 PKR

## Features

### 1. **Item Discount (Per Product)**
Toggle between two modes:
- **% Mode**: Enter discount percentage (0-100%)
- **PKR Mode**: Enter the final selling price

**Example:**
```
Original Price: 250 PKR
Mode: PKR
Enter: 240 PKR
Result: Automatically calculates 4% discount
```

### 2. **Bill Discount (Total Bill)**
Toggle between two modes:
- **% Mode**: Enter discount percentage for entire bill
- **PKR Mode**: Enter the final bill amount

**Example:**
```
Subtotal: 1000 PKR
Mode: PKR
Enter: 950 PKR
Result: Automatically calculates 5% discount
Discount Amount: -50 PKR
```

### 3. **UI Updates**
- **Discount Section**: Extra "% PKR" toggle buttons for easy mode switching
- **Input Fields**: 
  - Percentage mode: "0" placeholder
  - Price mode: "Selling price" / "Final bill price" placeholders
- **Display**: Shows which mode is active and the applied discount

### 4. **Automatic Calculation**
```javascript
Discount % = ((Original Price - Selling Price) / Original Price) × 100

// Example:
Discount % = ((250 - 240) / 250) × 100 = 4%
```

## UI Location

**Discount Section** (Below product grid):
```
Item: [% PKR toggle] [Input field] [Quick buttons: 5% 10% 15% 20%] [Clear]
     |
Bill: [% PKR toggle] [Input field] [Quick buttons: 5% 10% 15% 20%] [Clear]
```

## Usage Instructions

### Applying Item Discount by Price
1. Select discount mode for Item section
2. Click **PKR** button (instead of %)
3. Type the final selling price (e.g., 240)
4. Add product to cart
5. Discount automatically calculated and applied

### Applying Bill Discount by Price
1. Add all items to cart
2. Click **PKR** button in Bill section
3. Type the final bill total (e.g., 950)
4. Bill discount automatically calculated
5. Press checkout/payment

## Smart Features

✅ **Validation**: Ensures selling price ≤ original price  
✅ **Clamping**: Discount always kept between 0-100%  
✅ **Mixed Mode**: Use percentage for items, price for bill (or vice versa)  
✅ **Clear Buttons**: Easy reset individual discounts  
✅ **Display Flexibility**: Shows applied discount in both modes  

## Example Scenario

**Store Price**: 250 PKR
**Customer wants to pay**: 240 PKR

**Old Way (Calculate yourself)**:
- Calculate: (250-240)/250 × 100 = 4%
- Enter: 4%
- Risk: Math error!

**New Way (Let system calculate)**:
- Select PKR mode
- Type: 240
- Done! System shows 4% automatically ✨

## Technical Implementation

### New State Variables
```javascript
const [discountByPrice, setDiscountByPrice] = useState('')
const [itemDiscountType, setItemDiscountType] = useState('percentage')
const [billDiscountByPrice, setBillDiscountByPrice] = useState('')
const [billDiscountType, setBillDiscountType] = useState('percentage')
```

### Helper Functions
```javascript
calculateDiscountFromPrice(originalPrice, sellingPrice)
  // Returns discount percentage 0-100

getItemDiscountPercent(product)
  // Returns effective discount % based on current mode

getBillDiscountPercent()
  // Returns effective bill discount % based on current mode
```

## Benefits

🎯 **Faster Checkout**: No need to calculate discount percentages  
🎯 **Less Error-Prone**: System handles the math  
🎯 **Flexible**: Switch between modes anytime  
🎯 **User-Friendly**: Intuitive toggle buttons  
🎯 **Familiar**: Works exactly like before if using percentage mode  

## Notes

- Discount type preference is NOT saved between sessions (resets when page refreshes)
- Both item and bill discounts can use different modes simultaneously
- Quick buttons (5%, 10%, 15%, 20%) only appear in percentage mode
- Selling price must be ≤ original price (prevents invalid discounts)
