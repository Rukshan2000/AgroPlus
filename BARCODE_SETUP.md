# Barcode Authentication - Quick Setup Guide

## 1. Database Setup

The `barcode_id` column has been added to the users table. Verify with:

```bash
psql -U postgres -d saas -c "\d users"
```

You should see a `barcode_id` column with type `varchar(255)` and UNIQUE constraint.

## 2. Install Dependencies

```bash
npm install qrcode pdfkit
```

## 3. Environment Configuration (Optional)

Set encryption key for production (recommended):

```env
# .env.local
BARCODE_ENCRYPTION_KEY=your-generated-32-hex-character-key
```

Generate a key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 4. Test the System

### Step 1: Create a User with Barcode (via Admin UI)

1. Login to admin panel
2. Go to Users management
3. Click "Add User"
4. Fill in user details:
   - Name: John Doe
   - Email: john@example.com
   - Password: SecurePass123
   - Role: Cashier
5. **Check "Generate login barcode for this user"**
6. Click "Create User"
7. A modal will show the barcode - you can download it as PDF or PNG

### Step 2: Test Barcode Login

1. Navigate to `http://localhost:3000/barcode-login`
2. You'll see the barcode scanner interface
3. **Option A - Manual Entry:**
   - Click "Manual" tab
   - Copy the barcode ID from the display modal
   - Paste it in the input field
   - Click "Submit"
4. **Option B - Camera Scanning:**
   - Click "Start Camera"
   - Point camera at the QR code
   - Camera will scan and auto-submit
5. Upon success, you'll be logged in and redirected to dashboard

### Step 3: Download Barcode from User Account

1. Login as the user created in Step 1
2. Go to user settings/profile
3. Click "Download Barcode"
4. Choose PDF or PNG format
5. Print or save the barcode

## 5. Key API Endpoints

Test with curl:

```bash
# Login with barcode
curl -X POST http://localhost:3000/api/auth/barcode-login \
  -H "Content-Type: application/json" \
  -d '{"barcodeId": "your-barcode-id-here"}'

# Download barcode as PDF
curl -X GET "http://localhost:3000/api/user/barcode/download?format=pdf" \
  -H "Cookie: your-session-cookie" \
  -o barcode.pdf

# Preview barcode (returns base64 QR code)
curl -X POST http://localhost:3000/api/user/barcode/download \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{}'
```

## 6. File Structure

New files created:

```
lib/
  └── barcode.js                    # Encryption & QR code utilities

components/
  ├── barcode-scanner.jsx           # Scanner UI component
  └── barcode-display.jsx           # Display & download barcode

app/
  ├── barcode-login/
  │   └── page.tsx                  # Login page
  └── api/auth/
      ├── barcode-login/
      │   └── route.js              # Login endpoint
      └── user/barcode/download/
          └── route.js              # Download endpoint
```

## 7. Features Enabled

✅ Unique barcode ID generation per user
✅ AES-256-GCM encryption storage
✅ QR code generation
✅ PDF & PNG download
✅ Camera-based scanning
✅ Manual barcode entry
✅ Auto-login on successful scan
✅ Cashier work session integration
✅ Security warnings & user guidance
✅ Admin user creation with barcode option

## 8. Security Notes

- Barcode IDs are encrypted in database
- Each barcode is unique to a user
- Encryption key should be set via environment variable
- Session created automatically on successful scan
- Rate limiting recommended for production

## 9. Troubleshooting

### Barcode not appearing after user creation
- Check browser console for JavaScript errors
- Verify pdfkit is installed: `npm list pdfkit`
- Check network tab for API failures

### Camera not working
- Grant camera permission when prompted
- Try manual entry instead
- Check HTTPS requirement (some browsers need HTTPS for camera)

### PDF download fails
- Install pdfkit: `npm install pdfkit`
- Verify Node.js version
- Check server logs

### Barcode scan doesn't login
- Verify barcode ID is correct
- Check if user exists in database
- Review API logs: `npm run dev`
- Try manual entry to isolate issue

## 10. Next Steps

1. **Test the flow**: Create test user with barcode, then login using barcode
2. **Print barcodes**: Download and print barcodes for distribution to users
3. **Train users**: Show them how to use barcode login
4. **Monitor usage**: Track barcode login usage vs password login
5. **Optimize**: Adjust UI/UX based on user feedback

## 11. Documentation

Full documentation available in: [BARCODE_AUTHENTICATION.md](./BARCODE_AUTHENTICATION.md)

---

**Setup Complete!** Your barcode authentication system is ready to use.

Start the dev server:
```bash
npm run dev
```

Visit `/barcode-login` to test!
