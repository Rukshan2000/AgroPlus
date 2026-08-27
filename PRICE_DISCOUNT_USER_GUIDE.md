# Price-Based Discount - Usage Guide

## Quick Start

### Scenario 1: Student Discount by Price
**Item Price**: 500 PKR  
**Student pays**: 450 PKR

**Steps:**
1. Add product to cart normally (scan or search)
2. Below the product grid, look for **Item:** discount section
3. Click the **PKR** button (next to the % button)
4. Type `450` in the price field
5. ✅ System shows ~10% discount applied
6. Proceed with checkout

### Scenario 2: Bulk Order Final Price
**Subtotal**: 5000 PKR  
**Final agreed price**: 4700 PKR

**Steps:**
1. Add all items to cart
2. Look for **Bill:** discount section at bottom left
3. Click the **PKR** button
4. Type `4700` in the final price field
5. ✅ System shows 6% discount on entire bill
6. Proceed with payment

---

## Detailed Walkthrough

### Finding the Discount Section

The discount section is located below the product grid on the left side:

```
┌─────────────────────────────┐
│  PRODUCT GRID (3 columns)   │
│  [Product] [Product] [Prod] │
│  [Product] [Product] [Prod] │
│  [Product] [Product] [Prod] │
│  [Product] [Product] [Prod] │
├─────────────────────────────┤  ← You are here
│ Item: [% PKR] [Input] [Btns]│   Discount Section
│ Bill: [% PKR] [Input] [Btns]│
└─────────────────────────────┘
```

### Step-by-Step: Item Discount by Price

1. **Locate** the Item discount section
   ```
   Item: [% PKR] [________] 5% 10% 15% 20%
   ```

2. **Click PKR button**
   - Currently shows: `% ` (percentage mode)
   - Click button to switch to: `PKR` (price mode)
   - Button changes color (yellow) to show it's selected

3. **Enter selling price**
   - Input field changes appearance
   - Type the final selling price
   - Example: type `240` for a 250 PKR item

4. **View auto-calculated discount**
   - System shows in totals section:
   - `Item Discount (PKR 240): -LKR 10`
   - Means 4% was automatically calculated

5. **Clear if needed**
   - Click the **×** button to clear price
   - Discount will be removed

### Step-by-Step: Bill Discount by Price

1. **Add products** to cart first
   - Need items for bill total to show

2. **Locate** Bill discount section
   ```
   Bill: [% PKR] [________] 5% 10% 15% 20%
   ```

3. **Click PKR button**
   - Switch from `%` to `PKR`
   - This time for the entire bill

4. **Enter final bill amount**
   - Input field shows: "Final bill price"
   - Type the agreed total
   - Example: type `950` if subtotal is 1000

5. **Review totals**
   - Subtotal: LKR 1000
   - Bill Discount (PKR 950): -LKR 50
   - **TOTAL: LKR 950** ✅

---

## Common Scenarios

### Scenario A: Loyalty Customer
**What you know**: Customer pays 1800 PKR total  
**What you enter**: 
- Click PKR mode for Bill
- Type: 1800
- (System calculates discount %)

### Scenario B: Staff Discount
**What you know**: 20% off on products  
**What you enter**:
- Keep it as: % mode
- Type: 20
- (Or use the quick 20% button)

### Scenario C: Mix Both
**Item 1**: 500 → Customer pays 475 (use PKR mode)  
**Item 2**: 300 → Apply 10% (use % mode)  
**Bill level**: Additional 3% off total (use % mode)

**Steps**:
1. Add Item 1, switch Item discount to PKR, type 475
2. Add Item 2, switch Item discount back to %, type 10
3. Switch Bill discount to %, type 3
4. All discounts stack correctly! ✅

---

## Switching Between Modes

### From % to PKR
1. Click **PKR** button in the discount section
2. Previous % value is cleared
3. Enter new price value
4. To switch back, click **%** button

### From PKR to %
1. Click **%** button in the discount section
2. Previous price value is cleared
3. Enter percentage value
4. Quick buttons (5%, 10%, etc.) reappear

---

## Tips & Tricks

**Tip 1**: Use quick buttons for common discounts
- Instead of typing "5", just click the 5% button
- Only works in percentage mode

**Tip 2**: Clear before switching modes
- Click **×** button to fully clear
- Prevents confusion between modes

**Tip 3**: Always enter selling price, not discount amount
- ❌ WRONG: Enter "10" (discount PKR)
- ✅ RIGHT: Enter "240" (final price)

**Tip 4**: For bill discounts, use final agreed amount
- ❌ WRONG: Type the discount amount
- ✅ RIGHT: Type what customer actually pays

**Tip 5**: Check the totals display
- Shows which mode and value is active
- Confirms discount is applied correctly

---

## Troubleshooting

**Problem**: Discount section not showing  
**Solution**: Scroll down in the left panel (mobile) or look below products

**Problem**: Can't enter price, only numbers appear
**Solution**: Entered mode not activated. Click **PKR** button first.

**Problem**: Discount disappeared
**Solution**: Click **×** by accident. Re-enter the price/percentage.

**Problem**: Getting different total than expected
**Solution**: 
- Check which mode is active (% or PKR)
- Verify you entered the right value
- Note: Item discounts + Bill discounts stack

**Problem**: Can't type decimal like 240.50
**Solution**: Price mode allows decimals. Just type normally: 240.50

---

## Mode Indicators

Looking at the discount section:

**% Mode (Percentage)**
```
Item: [% ▼] [    0    ] % | 5% 10% 15% 20%
      └─ Yellow highlight means selected
```

**PKR Mode (Price)**
```
Item: [% | PKR ▼] [        ] PKR
           └─ Yellow highlight means selected
          └─ Input field is wider for prices
```

---

## Real-World Examples

### Example 1: Quick Customer Discount
Customer: "I only have 480 PKR"  
Item Price: 500 PKR

**Action**:
1. Click PKR button (Item section)
2. Type: 480
3. System: 4% discount automatically ✓

### Example 2: Bulk Order Negotiation
Customer: "200 items at 8000 total"  
Your price: 8500 PKR

**Action**:
1. Add 200 items (quantity mode)
2. Subtotal shows: 8500
3. Click PKR button (Bill section)
4. Type: 8000
5. System: 5.88% discount ✓

### Example 3: Multiple Discounts
Regular 10% + Staff 5% + Bill 3%

**Action**:
1. Item discount: % mode, type 10
2. Bill discount: % mode, type 3
3. (Discounts stack together)
4. Total effective discount shown ✓

---

## Summary

| Mode | What to Enter | When to Use | Example |
|------|---------------|------------|---------|
| % | Discount percent | Standard discount | 10%, 15%, 20% |
| PKR | Final selling price | When customer says final price | 240 (instead of 4%) |

**Remember**: Enter what you KNOW!
- Know the discount %? → Use % mode
- Know the final price? → Use PKR mode
