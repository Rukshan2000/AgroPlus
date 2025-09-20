import { listWorkSessions, getMyWorkSessions } from '../../../../controllers/hrController'

export const dynamic = "force-dynamic"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const my = searchParams.get('my')
  
  if (my === 'true') {
    return getMyWorkSessions(request)
  }
  
  return listWorkSessions(request)
}
