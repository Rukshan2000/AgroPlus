import {
  createReturn,
  listReturns,
  getReturnStats,
  getReturnById,
  getReturnsBySale,
  checkReturnEligibility
} from '../models/returnModel.js';
import { getSaleById } from '../models/salesModel.js';

/**
 * Process a product return
 */
export async function processReturn(data, userId) {
  const { sale_id, product_id, quantity_returned, return_reason, restocked = true } = data;

  // Validate input
  if (!sale_id || !product_id || !quantity_returned) {
    throw new Error('Missing required fields: sale_id, product_id, quantity_returned');
  }

  if (quantity_returned <= 0) {
    throw new Error('Quantity returned must be greater than 0');
  }

  // Check eligibility
  const eligibility = await checkReturnEligibility(sale_id, product_id);
  
  if (!eligibility.eligible) {
    throw new Error(eligibility.reason);
  }

  if (quantity_returned > eligibility.remainingQuantity) {
    throw new Error(
      `Cannot return ${quantity_returned} items. Maximum returnable quantity is ${eligibility.remainingQuantity}`
    );
  }

  // Calculate refund amount (proportional to quantity)
  const refund_amount = (eligibility.sale.total_amount / eligibility.sale.quantity) * quantity_returned;

  // Create the return
  const returnRecord = await createReturn({
    sale_id,
    product_id,
    product_name: eligibility.sale.product_name,
    quantity_returned,
    original_quantity: eligibility.sale.quantity,
    return_reason: return_reason || 'No reason provided',
    refund_amount,
    restocked,
    processed_by: userId
  });

  return {
    return: returnRecord,
    refund_amount,
    message: 'Return processed successfully'
  };
}

/**
 * Get all returns with pagination and filters
 */
export async function getAllReturns(filters = {}) {
  return await listReturns(filters);
}

/**
 * Get return statistics
 */
export async function getStatistics(days = 30) {
  return await getReturnStats(days);
}

/**
 * Get single return details
 */
export async function getReturnDetails(id) {
  const returnData = await getReturnById(id);
  
  if (!returnData) {
    throw new Error('Return not found');
  }

  return returnData;
}

/**
 * Get returns for a specific sale
 */
export async function getSaleReturns(sale_id) {
  return await getReturnsBySale(sale_id);
}

/**
 * Check if items from a sale can be returned
 */
export async function checkIfReturnable(sale_id, product_id) {
  return await checkReturnEligibility(sale_id, product_id);
}
