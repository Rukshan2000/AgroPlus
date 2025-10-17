import { NextResponse } from 'next/server';
import { getSession } from '../../../lib/auth.js';
import {
  processReturn,
  getAllReturns,
  getStatistics,
  checkIfReturnable
} from '../../../controllers/returnController.js';

/**
 * POST /api/returns - Process a new return
 */
export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const result = await processReturn(body, session.user.id);

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('Return API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process return' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/returns - Get all returns or statistics
 */
export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statsOnly = searchParams.get('stats') === 'true';
    const days = searchParams.get('days') || '30';
    const checkEligibility = searchParams.get('check_eligibility') === 'true';
    const sale_id = searchParams.get('sale_id');
    const product_id = searchParams.get('product_id');

    // Check return eligibility
    if (checkEligibility && sale_id && product_id) {
      const eligibility = await checkIfReturnable(
        parseInt(sale_id),
        parseInt(product_id)
      );
      return NextResponse.json(eligibility);
    }

    // Get statistics
    if (statsOnly) {
      const stats = await getStatistics(parseInt(days));
      return NextResponse.json(stats);
    }

    // Get returns list
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    const returns = await getAllReturns({
      page,
      limit,
      start_date,
      end_date
    });

    return NextResponse.json(returns);

  } catch (error) {
    console.error('Returns GET Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch returns' },
      { status: 500 }
    );
  }
}
