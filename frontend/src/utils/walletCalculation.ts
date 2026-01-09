/**
 * Wallet calculation utilities for frontend
 */

export interface CashCollectionParams {
  billingAmount: number;
  spareAmount?: number;
  travellingAmount?: number;
  bookingAmount?: number;
  gstIncluded?: boolean;
}

export interface CashCollectionResult {
  billingAmount: number;
  netBillingAmount: number;
  spareAmount: number;
  travellingAmount: number;
  bookingAmount: number;
  gstAmount: number;
  gstIncluded: boolean;
  calculatedAmount: number;
  breakdown: {
    baseAmount: number;
    percentage: string;
    spareAmount: number;
    travellingAmount: number;
    bookingAmount: number;
    gstAmount: number;
  };
}

/**
 * Calculate cash collection deduction amount
 * This mirrors the backend calculation logic
 */
export function calculateCashCollectionDeduction(params: CashCollectionParams): CashCollectionResult {
  const {
    billingAmount,
    spareAmount = 0,
    travellingAmount = 0,
    bookingAmount = 0,
    gstIncluded = false
  } = params;

  let gstAmount = 0;
  let netBillingAmount = billingAmount;

  // Calculate GST if included (billing amount is GST-exclusive, GST added on top)
  if (gstIncluded) {
    gstAmount = billingAmount * 0.18; // 18% GST on base amount
    netBillingAmount = billingAmount; // Base amount (GST-excluded)
  }

  let calculatedAmount = 0;

  // Cash collection: (Billing - Spare - Travel) * 50%
  const baseAmount = netBillingAmount - spareAmount - travellingAmount;
  calculatedAmount = baseAmount * 0.5;

  // Add GST amount to cash collection deduction if GST is included
  if (gstIncluded) {
    calculatedAmount += gstAmount;
  }

  return {
    billingAmount,
    netBillingAmount,
    spareAmount,
    travellingAmount,
    bookingAmount,
    gstAmount,
    gstIncluded,
    calculatedAmount: Math.round(calculatedAmount * 100) / 100,
      breakdown: {
        baseAmount: netBillingAmount - spareAmount - travellingAmount,
        percentage: '50%',
        spareAmount,
        travellingAmount,
        gstAmount
      }
  };
}
