# Barcode Authentication System

## Overview

The barcode authentication system allows users to login using a unique barcode ID instead of email and password. Each user gets a generated barcode that can be scanned or entered manually for instant authentication.

## Features

✅ **Unique Barcode ID Generation** - Every user gets a unique encrypted barcode ID
✅ **QR Code Display** - Visual representation of barcode for easy scanning
✅ **PDF & PNG Downloads** - Export barcode as PDF document or PNG image
✅ **Camera Scanning** - Real-time barcode scanning using device camera
✅ **Manual Entry** - Manual barcode ID entry as fallback
✅ **Encrypted Storage** - Barcode IDs are encrypted in the database
✅ **Auto Login** - No password needed, instant authentication after scanning
✅ **Work Session Integration** - Automatic work session creation for cashiers

## Database Schema

### Users Table (Updated)
```sql
ALTER TABLE users ADD COLUMN barcode_id VARCHAR(255) UNIQUE;
```

The `barcode_id` column stores the encrypted barcode ID for each user.

## Components & Files

### Backend

#### 1. **lib/barcode.js**
Utility functions for barcode operations:
- `generateBarcodeId()` - Generate unique barcode ID
- `encryptBarcodeId(barcodeId)` - Encrypt barcode using AES-256-GCM
- `decryptBarcodeId(encrypted)` - Decrypt barcode (for internal use)
- `generateQRCode(barcodeId)` - Generate QR code as data URL
- `generateBarcodePDF(barcodeId, userName, userEmail)` - Generate PDF with barcode
- `isValidBarcodeId(barcodeId)` - Validate barcode format

#### 2. **models/userModel.js** (Updated)
Enhanced with barcode support:
- `findUserByBarcodeId(barcodeId)` - Find user by barcode ID
- `createUser()` - Updated to support `generateBarcode` parameter

#### 3. **app/api/auth/barcode-login/route.js**
POST endpoint for barcode authentication:
- Accepts: `{ barcodeId: string }`
- Returns: `{ user: {...}, error?: string }`
- Creates session and work session automatically

#### 4. **app/api/user/barcode/download/route.js**
Barcode management endpoints:
- **GET**: Download barcode as PDF or PNG
  - Parameters: `format=pdf|png`, `userId` (optional)
- **POST**: Get barcode preview
  - Returns QR code as base64

### Frontend

#### 1. **components/barcode-scanner.jsx**
Interactive scanner component:
- Camera scanning (real-time barcode detection)
- Manual input mode
- Error handling and permissions
- Responsive design

#### 2. **components/barcode-display.jsx**
Display component for showing barcodes:
- QR code visualization
- Barcode ID display
- Copy to clipboard functionality
- PDF & PNG download buttons
- Security warnings

#### 3. **app/barcode-login/page.tsx**
Dedicated login page:
- Full-page barcode login interface
- Redirect to dashboard on success
- Links to email login and registration
- User-friendly instructions

## Usage Flow

### 1. User Registration with Barcode

```javascript
// Frontend - Register with barcode
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    name: 'John Doe',
    role: 'user',
    generateBarcode: true  // Enable barcode generation
  })
})

const data = await response.json()
// data.barcodeId contains the plain barcode ID (show only once!)
```

### 2. Download Barcode

```javascript
// Download as PDF
const response = await fetch('/api/user/barcode/download?format=pdf')
const blob = await response.blob()
// Save blob as file

// Download as PNG
const response = await fetch('/api/user/barcode/download?format=png')
const blob = await response.blob()
// Save blob as image
```

### 3. Login with Barcode

```javascript
// Frontend - Barcode login
const response = await fetch('/api/auth/barcode-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    barcodeId: 'scanned_or_entered_barcode_id'
  })
})

const data = await response.json()
// User is logged in automatically
// Redirect to dashboard
```

## Security Features

### 1. Encryption
- Barcode IDs are encrypted using **AES-256-GCM** before storage
- Encryption key from environment variable `BARCODE_ENCRYPTION_KEY`
- Unique IV (Initialization Vector) for each encryption

### 2. Uniqueness
- `barcode_id` column has UNIQUE constraint
- Each user has only one barcode ID
- Prevents duplicate barcode IDs

### 3. Session Management
- Creates authenticated session after successful barcode scan
- Automatic work session for cashiers
- Respects existing session management

### 4. Display Security
- Plain barcode ID shown only once during creation
- Database stores encrypted version
- Cannot be retrieved again (except through download process)

## API Reference

### POST /api/auth/barcode-login
Authenticate user with barcode.

**Request:**
```json
{
  "barcodeId": "hex_string_32_chars"
}
```

**Response (Success):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "outlets": []
  }
}
```

**Response (Error):**
```json
{
  "error": "Invalid barcode or user not found"
}
```

### GET /api/user/barcode/download
Download barcode file.

**Parameters:**
- `format`: `pdf` or `png` (default: `pdf`)
- `userId`: User ID (optional, defaults to current user)
- `adminOverride`: Set to `true` if admin downloading for another user

**Response:**
- Binary file download (PDF or PNG)

### POST /api/user/barcode/download
Preview barcode QR code.

**Request:**
```json
{
  "userId": 1  // Optional
}
```

**Response:**
```json
{
  "barcodeId": "encrypted_id",
  "userName": "John Doe",
  "userEmail": "user@example.com",
  "qrCode": "data:image/png;base64,..."
}
```

## Integration Points

### Admin User Creation
Update the admin user creation form to include:
```jsx
<checkbox name="generateBarcode" label="Generate Login Barcode" />
```

### Login Page
Add button to redirect to barcode login:
```jsx
<a href="/barcode-login">Login with Barcode</a>
```

### User Settings
Add option to:
- Download barcode
- Regenerate barcode
- View barcode history

## Environment Variables

```bash
# Optional: Custom encryption key
# If not set, a random key is generated (set one for production)
BARCODE_ENCRYPTION_KEY=your_32_byte_hex_key
```

## Frontend Integration Example

```jsx
'use client'
import { BarcodeScanner } from '@/components/barcode-scanner'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function BarcodeLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleScan = async (barcodeId) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/barcode-login', {
        method: 'POST',
        body: JSON.stringify({ barcodeId })
      })
      
      if (res.ok) {
        router.push('/app/dashboard')
      } else {
        setError('Invalid barcode')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <BarcodeScanner 
      onScan={handleScan}
      onError={setError}
      disabled={loading}
    />
  )
}
```

## Testing

### Test Barcode Login
1. Create user with barcode enabled
2. Copy the generated barcode ID
3. Visit `/barcode-login`
4. Enter barcode ID manually (or scan QR code)
5. Should auto-login and redirect to dashboard

### Test Barcode Download
1. Login as user
2. Visit `/api/user/barcode/download?format=pdf`
3. PDF should download with QR code

## Troubleshooting

### "Barcode ID not found" error
- Ensure user was created with `generateBarcode: true`
- Check that `barcode_id` column exists in users table
- Verify encryption key matches between encrypt/decrypt

### QR Code not loading
- Check if `/api/user/barcode/download` endpoint is accessible
- Verify user has valid session
- Check browser console for CORS or network errors

### Camera permission denied
- User must allow camera access in browser
- On HTTPS only (or localhost for testing)
- Check browser permissions settings

## Future Enhancements

- [ ] Biometric authentication (face/fingerprint + barcode)
- [ ] Barcode validity expiration
- [ ] Multiple barcodes per user
- [ ] Barcode usage analytics/logs
- [ ] Mobile app barcode scanning
- [ ] Batch barcode generation
- [ ] Custom barcode design/branding
- [ ] Integration with POS system scanning

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review API response error messages
3. Check browser console for client-side errors
4. Review server logs for backend errors
