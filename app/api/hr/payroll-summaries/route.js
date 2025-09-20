import { listPayrollSummaries, calculatePayroll, getMyPayrollSummary } from '../../../../controllers/hrController'

export const dynamic = "force-dynamic"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const my = searchParams.get('my')
  
  if (my === 'true') {
    return getMyPayrollSummary(request)
  }
  
  return listPayrollSummaries(request)
}

export async function POST(request) {
  return calculatePayroll(request)
}
