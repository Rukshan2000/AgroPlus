import crypto from 'crypto'
import QRCode from 'qrcode'

// Encryption key from environment or generate a default
// Key should be 32 bytes (64 hex characters)
const getEncryptionKey = () => {
  if (process.env.BARCODE_ENCRYPTION_KEY) {
    const key = process.env.BARCODE_ENCRYPTION_KEY
    // If key is 64 hex chars, convert to buffer; if 32 bytes of raw data, use as is
    if (key.length === 64) {
      return Buffer.from(key, 'hex')
    }
    return Buffer.from(key)
  }
  // Generate a random 32-byte key for default
  return crypto.randomBytes(32)
}

const ENCRYPTION_KEY = getEncryptionKey()

/**
 * Generate a unique barcode ID
 * @returns {string} A unique barcode ID
 */
export function generateBarcodeId() {
  return crypto.randomBytes(16).toString('hex')
}

/**
 * Encrypt the barcode ID using AES-256-GCM
 * @param {string} barcodeId - The barcode ID to encrypt
 * @returns {string} Encrypted barcode ID with IV and auth tag (format: iv:encryptedData:authTag)
 */
export function encryptBarcodeId(barcodeId) {
  try {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      ENCRYPTION_KEY,
      iv
    )
    
    let encrypted = cipher.update(barcodeId, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    // Return in format: iv:encryptedData:authTag for storage
    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`
  } catch (error) {
    console.error('Error encrypting barcode ID:', error)
    throw new Error('Failed to encrypt barcode ID')
  }
}

/**
 * Decrypt the barcode ID
 * @param {string} encryptedData - The encrypted barcode ID (format: iv:encryptedData:authTag)
 * @returns {string} Decrypted barcode ID
 */
export function decryptBarcodeId(encryptedData) {
  try {
    const [ivHex, encrypted, authTagHex] = encryptedData.split(':')
    
    if (!ivHex || !encrypted || !authTagHex) {
      throw new Error('Invalid encrypted data format')
    }
    
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      ENCRYPTION_KEY,
      iv
    )
    
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Error decrypting barcode ID:', error)
    throw new Error('Failed to decrypt barcode ID')
  }
}

/**
 * Generate a QR code image as data URL
 * @param {string} barcodeId - The barcode ID to encode
 * @returns {Promise<string>} Data URL of the QR code image
 */
export async function generateQRCode(barcodeId) {
  try {
    // Generate QR code with barcode ID - can be used for scanning
    const dataUrl = await QRCode.toDataURL(barcodeId, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    return dataUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Generate a barcode image as data URL (1D barcode)
 * @param {string} barcodeId - The barcode ID to encode
 * @returns {Promise<string>} Data URL of the barcode image
 */
export async function generateBarcode(barcodeId) {
  try {
    // For 1D barcode, we can use QR code or implement a proper barcode library
    // For now, we'll use QR code which is more practical for scanning
    return await generateQRCode(barcodeId)
  } catch (error) {
    console.error('Error generating barcode:', error)
    throw new Error('Failed to generate barcode')
  }
}

/**
 * Generate a PDF with the barcode
 * @param {string} barcodeId - The barcode ID
 * @param {string} userName - User name for the document
 * @param {string} userEmail - User email for the document
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generateBarcodePDF(barcodeId, userName, userEmail) {
  try {
    // Dynamic import for PDFDocument
    const PDFDocument = (await import('pdfkit')).default
    
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    })
    
    // Collect PDF data
    const chunks = []
    doc.on('data', (chunk) => chunks.push(chunk))
    
    return new Promise(async (resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks))
      })
      
      doc.on('error', reject)
      
      try {
        // Title
        doc.fontSize(24).font('Helvetica-Bold').text('User Login Barcode', { align: 'center' })
        doc.moveDown()
        
        // User info
        doc.fontSize(12).font('Helvetica')
        doc.text(`Name: ${userName}`, { align: 'left' })
        doc.text(`Email: ${userEmail}`, { align: 'left' })
        doc.moveDown()
        
        // Instructions
        doc.fontSize(10).font('Helvetica').fillColor('#666666')
        doc.text('Scan the barcode below to login automatically:', { align: 'center' })
        doc.moveDown(0.5)
        
        // Generate and add QR code - WAIT for the promise to resolve
        try {
          const dataUrl = await QRCode.toDataURL(barcodeId, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            quality: 0.95,
            margin: 1,
            width: 300
          })
          
          // Add QR code image
          const imageBuffer = Buffer.from(dataUrl.split(',')[1], 'base64')
          doc.image(imageBuffer, {
            fit: [250, 250],
            align: 'center'
          })
          
          doc.moveDown()
          
          // Barcode ID for reference
          doc.fontSize(10).font('Helvetica').fillColor('#000000')
          doc.text(`Barcode ID: ${barcodeId}`, { align: 'center' })
          doc.moveDown()
          
          // Footer
          doc.fontSize(8).fillColor('#999999')
          doc.text('Keep this document safe. Do not share the barcode ID.', { align: 'center' })
          doc.text('Generated on: ' + new Date().toLocaleString(), { align: 'center' })
          
          // Now safely end the document
          doc.end()
        } catch (qrError) {
          console.error('Error generating QR code for PDF:', qrError)
          reject(new Error('Failed to generate QR code for barcode PDF'))
        }
      } catch (error) {
        console.error('Error building PDF document:', error)
        reject(error)
      }
    })
  } catch (error) {
    console.error('Error generating barcode PDF:', error)
    throw new Error('Failed to generate barcode PDF')
  }
}

/**
 * Validate barcode ID format
 * @param {string} barcodeId - The barcode ID to validate
 * @returns {boolean} True if valid
 */
export function isValidBarcodeId(barcodeId) {
  return typeof barcodeId === 'string' && barcodeId.length === 32 && /^[a-f0-9]{32}$/.test(barcodeId)
}
