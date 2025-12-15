import { comparePassword } from '@/lib/hash'
import { getDb } from '@/lib/db'

export async function POST(request) {
  try {
    const { password } = await request.json()

    if (!password) {
      return Response.json(
        { success: false, message: 'Password is required' },
        { status: 400 }
      )
    }

    // Get admin users from database
    const pool = getDb()
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE role = $1 LIMIT 1',
      ['admin']
    )

    if (result.rows.length === 0) {
      return Response.json(
        { success: false, message: 'No admin user found' },
        { status: 404 }
      )
    }

    const adminUser = result.rows[0]
    
    // Verify password
    const isValid = await comparePassword(password, adminUser.password_hash)

    if (!isValid) {
      return Response.json(
        { success: false, message: 'Invalid password' },
        { status: 401 }
      )
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Admin verification error:', error)
    return Response.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
