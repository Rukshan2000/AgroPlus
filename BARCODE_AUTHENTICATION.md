# Barcode Authentication System Implementation

## Overview

The barcode authentication system allows users to login quickly by scanning a QR code barcode instead of entering email and password. Each user has a unique encrypted barcode ID that can be downloaded and used for instant login.

## Features

### 1. **Barcode Generation**
- Unique barcode ID generated when user is created (optional)
- Encrypted storage in database using AES-256-GCM encryption
- QR code format for easy scanning

### 2. **User Creation with Barcode**
- Admin users can create new users with barcode generation enabled
- Checkbox option in user creation modal to generate barcode
- Barcode displayed immediately after user creation
- User can download barcode as PDF or PNG

### 3. **Barcode Login**
- Dedicated barcode login page: `/barcode-login`
- Two scan methods:
  - **Camera Scanning**: Use device camera to scan QR code (with fallback for devices without camera)
  - **Manual Entry**: Enter barcode ID manually if scanning fails
- Automatic login upon successful barcode scan
- No password required

### 4. **Barcode Download**
- Download barcode as PDF (printable document with user info and QR code)
- Download barcode as PNG (image file)
- Accessible from user dashboard

## Database Schema

### Users Table Changes
```sql
ALTER TABLE users ADD COLUMN barcode_id VARCHAR(255) UNIQUE;
```

The `barcode_id` column stores the encrypted barcode ID.

## Files Added/Modified

### New Files

1. **`lib/barcode.js`**
   - Barcode generation and encryption utilities
   - Functions:
     - `generateBarcodeId()`: Generate unique 32-char hex ID
     - `encryptBarcodeId(barcodeId)`: AES-256-GCM encryption
     - `decryptBarcodeId(encryptedData)`: Decrypt barcode ID
     - `generateQRCode(barcodeId)`: Generate QR code as data URL
     - `generateBarcode(barcodeId)`: Wrapper for barcode generation
     - `generateBarcodePDF(barcodeId, userName, userEmail)`: Generate PDF with barcode
     - `isValidBarcodeId(barcodeId)`: Validate barcode format

2. **`components/barcode-scanner.jsx`**
   - React component for barcode scanning
   - Features:
     - Camera scanning with video feed
     - Manual barcode ID input
     - Real-time barcode detection
     - Permission handling
     - Error messages

3. **`components/barcode-display.jsx`**
   - React component to display barcode after creation
   - Features:
     - QR code display
     - Barcode ID preview
     - Download PDF/PNG buttons
     - Security warnings
     - User information display

4. **`app/barcode-login/page.tsx`**
   - Dedicated barcode login page
   - Features:
     - Barcode scanner integration
     - Success/error handling
     - Links to email login and registration
     - Responsive design

5. **`app/api/auth/barcode-login/route.js`**
   - API endpoint for barcode authentication
   - Accepts: `{ barcodeId: string }`
   - Returns: User object with session created
   - Handles cashier work session creation

6. **`app/api/user/barcode/download/route.js`**
   - API endpoint for barcode download and preview
   - GET: Download barcode as PDF/PNG
   - POST: Get barcode preview (QR code as base64)
   - Supports format parameter: `pdf` or `png`

### Modified Files

1. **`models/userModel.js`**
   - Added `findUserByBarcodeId(barcodeId)`: Find user by barcode
   - Updated `createUser()`: Support `generateBarcode` option
   - Imports barcode utilities

2. **`controllers/authController.js`**
   - Updated `register()`: Support `generateBarcode` flag
   - Returns `barcodeId` in response (only shown once)

3. **`components/add-user-modal.jsx`**
   - Added checkbox for barcode generation
   - Integrated `BarcodeDisplay` component
   - Shows barcode modal after user creation

## Usage Guide

### For Admins: Creating User with Barcode

1. Click "Add User" button in users management
2. Fill in user details (email, password, role, etc.)
3. Enable "Generate login barcode for this user" checkbox
4. Click "Create User"
5. A barcode modal will appear showing:
   - QR code
   - Barcode ID
   - Download options (PDF/PNG)
6. Admin can print or share the barcode with user

### For Users: Login with Barcode

1. Navigate to `/barcode-login`
2. Choose scan method:
   - **Camera**: Click "Start Camera" and point at barcode
   - **Manual**: Enter the 32-character barcode ID
3. Upon successful scan, user is automatically logged in
4. Redirected to dashboard

### For Users: Download Barcode

1. Login to account
2. Go to user settings/profile
3. Click "Download Barcode"
4. Choose format (PDF or PNG)
5. Print or save the barcode

## Security Considerations

### Encryption
- Barcode IDs are encrypted using AES-256-GCM
- Encryption key from environment variable `BARCODE_ENCRYPTION_KEY`
- Each barcode has unique IV and authentication tag

### Authentication
- Barcode login creates session like regular login
- No password required (barcode ID acts as authentication token)
- Session validation still applied
- Cashier work sessions created automatically

### Best Practices
- Keep barcode private and secure
- Don't share barcode ID publicly
- Use strong encryption key in production
- Implement rate limiting on barcode-login endpoint
- Log all barcode login attempts

## Environment Variables

```env
# Optional - if not set, generates random key (use in production)
BARCODE_ENCRYPTION_KEY=your-32-character-hex-key-here
```

Generate a secure key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## API Endpoints

### POST `/api/auth/barcode-login`
Login with barcode ID

**Request:**
```json
{
  "barcodeId": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "role": "cashier",
    "outlets": [1, 2]
  }
}
```

### GET `/api/user/barcode/download?format=pdf&userId=<id>`
Download barcode as PDF or PNG

**Parameters:**
- `format`: `pdf` or `png` (default: pdf)
- `userId`: User ID (optional, defaults to current user)

**Response:** File download

### POST `/api/user/barcode/download`
Preview barcode (get QR code as base64)

**Request:**
```json
{
  "userId": null  // null = current user
}
```

**Response:**
```json
{
  "barcodeId": "encrypted_barcode_id",
  "userName": "User Name",
  "userEmail": "user@example.com",
  "qrCode": "data:image/png;base64,..."
}
```

## Dependencies

The system uses:
- `qrcode`: QR code generation
- `pdfkit`: PDF generation
- Node's built-in `crypto` module for encryption

Install with:
```bash
npm install qrcode pdfkit
```

## Testing

### Test Barcode Generation
```bash
node -e "
import('./lib/barcode.js').then(({generateBarcodeId, encryptBarcodeId, decryptBarcodeId}) => {
  const id = generateBarcodeId();
  console.log('Generated:', id);
  const encrypted = encryptBarcodeId(id);
  console.log('Encrypted:', encrypted);
  const decrypted = decryptBarcodeId(encrypted);
  console.log('Decrypted:', decrypted);
  console.log('Match:', id === decrypted);
})
"
```

### Test Login Flow
1. Create user with barcode enabled
2. Copy barcode ID from display
3. Go to `/barcode-login`
4. Enter barcode ID manually
5. Should login successfully

## Troubleshooting

### Barcode Scan Not Working
- Check browser permissions for camera
- Ensure good lighting for QR code
- Try manual entry instead
- Verify barcode is not corrupted

### PDF Generation Error
- Ensure pdfkit is installed: `npm install pdfkit`
- Check server logs for specific error
- Verify Node.js version supports pdfkit

### Encryption Key Issues
- Set `BARCODE_ENCRYPTION_KEY` environment variable
- Key must be 32 hex characters (64 chars in string form for Base64)
- Use generated key consistently across deployment

### Barcode Not Appearing After Creation
- Check browser console for errors
- Verify API endpoint `/api/user/barcode/download` is accessible
- Check server logs for PDF generation issues
- Try PNG download instead

## Future Enhancements

1. **Advanced Scanning**
   - Implement jsQR or @zxing/library for browser-based barcode detection
   - Support for multiple barcode formats (Code128, UPC, etc.)

2. **Barcode Management**
   - Regenerate barcode option
   - Barcode history/audit log
   - Barcode expiration

3. **Mobile App Integration**
   - Deep linking from mobile barcode apps
   - Native camera integration

4. **Additional Features**
   - QR code customization (logo, colors)
   - Batch barcode generation
   - Barcode printing at registration
   - Two-factor authentication with barcode

## Support

For issues or questions, check:
1. Server logs: `npm run dev` output
2. Browser console for client-side errors
3. Database queries in `/api/auth/barcode-login`
4. API response in network tab

---

**Last Updated**: December 2024
**Version**: 1.0.0
