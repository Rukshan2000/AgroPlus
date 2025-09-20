import { listPayrollInfo } from '../../../../controllers/hrController'

export const dynamic = "force-dynamic"

export async function GET() {
  return listPayrollInfo()
}
