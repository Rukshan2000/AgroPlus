import { getSession } from '../../../../lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session) {
      return Response.json({ user: null }, { status: 401 })
    }

    return Response.json(session)
  } catch (error) {
    console.error('Session API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
