import { query } from "../lib/db"
import { generateBarcodeId, encryptBarcodeId, decryptBarcodeId } from "../lib/barcode.js"

export async function findUserByEmail(email) {
  const result = await query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email])
  return result.rows[0] || null
}

export async function findUserById(id) {
  const result = await query(
    'SELECT id, email, name, role, theme_preference, outlets, barcode_id, created_at, updated_at FROM users WHERE id = $1 LIMIT 1',
    [id]
  )
  return result.rows[0] || null
}

export async function findUserByBarcodeId(barcodeId) {
  try {
    const plainBarcodeId = (barcodeId || '').trim()
    
    if (!plainBarcodeId) {
      return null
    }

    // Get all users with barcodes
    const result = await query(
      'SELECT id, email, name, role, theme_preference, outlets, barcode_id, created_at, updated_at FROM users WHERE barcode_id IS NOT NULL'
    )
    
    // Decrypt and compare barcodes
    for (const user of result.rows) {
      try {
        const decryptedId = decryptBarcodeId(user.barcode_id)
        if (decryptedId === plainBarcodeId) {
          return user
        }
      } catch (error) {
        // Skip users with invalid encrypted barcodes
        console.warn(`Warning: Could not decrypt barcode for user ${user.id}`)
        continue
      }
    }
    
    return null
  } catch (error) {
    console.error('Error finding user by barcode ID:', error)
    throw error
  }
}

export async function createUser({ email, password_hash, name, role = "user", outlets = [], generateBarcode = false }) {
  // Generate and encrypt barcode if requested
  let barcodeId = null
  let encryptedBarcodeId = null
  
  if (generateBarcode) {
    barcodeId = generateBarcodeId()
    encryptedBarcodeId = encryptBarcodeId(barcodeId)
  }
  
  const result = await query(`
    INSERT INTO users (email, password_hash, name, role, outlets, barcode_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, email, name, role, theme_preference, outlets, barcode_id, created_at, updated_at
  `, [email, password_hash, name, role, JSON.stringify(outlets), encryptedBarcodeId])
  
  // Return the unencrypted barcode ID for display to the user (only shown once)
  const user = result.rows[0]
  return {
    ...user,
    plainBarcodeId: barcodeId // Only return plain ID for initial display/download
  }
}

export async function listUsers() {
  const result = await query(`
    SELECT id, email, name, role, theme_preference, outlets, created_at
    FROM users
    ORDER BY created_at DESC
  `)
  return result.rows
}

export async function updateUserRole(id, role) {
  const result = await query(`
    UPDATE users SET role = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, email, name, role, theme_preference, outlets
  `, [role, id])
  return result.rows[0] || null
}

export async function updateUserOutlets(id, outlets) {
  const result = await query(`
    UPDATE users SET outlets = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, email, name, role, theme_preference, outlets
  `, [JSON.stringify(outlets || []), id])
  return result.rows[0] || null
}

export async function updateUserTheme(id, theme) {
  const result = await query(`
    UPDATE users SET theme_preference = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, email, name, role, theme_preference, outlets
  `, [theme, id])
  return result.rows[0] || null
}
export async function updateUser(id, updates) {
  // Build dynamic update query based on provided fields
  const fields = Object.keys(updates)
  const values = Object.values(updates)
  
  if (fields.length === 0) {
    return findUserById(id)
  }

  // Build SET clause with proper parameterization
  const setClauses = []
  fields.forEach((field, index) => {
    setClauses.push(`${field} = $${index + 1}`)
  })
  setClauses.push(`updated_at = NOW()`)
  
  const setClause = setClauses.join(', ')
  const idParamIndex = fields.length + 1
  
  try {
    const result = await query(`
      UPDATE users SET ${setClause}
      WHERE id = $${idParamIndex}
      RETURNING id, email, name, role, theme_preference, outlets, barcode_id, created_at, updated_at
    `, [...values, id])
    
    return result.rows[0] || null
  } catch (error) {
    console.error('Error updating user:', error)
    throw error
  }
}

export async function updateUserBarcode(id, barcodeId) {
  try {
    const result = await query(`
      UPDATE users SET barcode_id = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, email, name, role, theme_preference, outlets, barcode_id, created_at, updated_at
    `, [barcodeId, id])
    
    return result.rows[0] || null
  } catch (error) {
    console.error('Error updating user barcode:', error)
    throw error
  }
}