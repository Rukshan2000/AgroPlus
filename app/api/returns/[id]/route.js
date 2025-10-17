import { NextResponse } from 'next/server';
import { getSession } from '../../../../lib/auth.js';
import { getReturnDetails } from '../../../../controllers/returnController.js';

/**
 * GET /api/returns/[id] - Get specific return details
 */
export async function GET(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const returnData = await getReturnDetails(parseInt(id));

    return NextResponse.json(returnData);

  } catch (error) {
    console.error('Return Details Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch return details' },
      { status: 500 }
    );
  }
}
