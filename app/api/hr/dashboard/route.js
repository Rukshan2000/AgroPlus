import { getHRDashboard } from '../../../../controllers/hrController'

export const dynamic = "force-dynamic"

export async function GET() {
  return getHRDashboard()
}
