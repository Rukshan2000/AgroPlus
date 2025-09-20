import { approvePayrollSummary } from '../../../../../../controllers/hrController'

export const dynamic = "force-dynamic"

export async function PATCH(request, context) {
  return approvePayrollSummary(request, context)
}
