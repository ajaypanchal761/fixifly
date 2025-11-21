const WalletCalculationService = require('../services/walletCalculationService');

// Test the cash collection calculation
console.log('=== Testing Cash Collection Calculation ===');

// Example values
const billingAmount = 1000;
const spareAmount = 200;
const travellingAmount = 100;
const bookingAmount = 200; // Changed from 590 to 200 as per user's example

console.log('Input values:');
console.log(`Billing Amount: ₹${billingAmount}`);
console.log(`Spare Amount: ₹${spareAmount}`);
console.log(`Travel Amount: ₹${travellingAmount}`);
console.log(`Booking Amount: ₹${bookingAmount}`);

// Calculate cash collection deduction
const calculation = WalletCalculationService.calculateCashCollectionDeduction({
  billingAmount,
  spareAmount,
  travellingAmount,
  bookingAmount,
  gstIncluded: false
});

console.log('\n=== Cash Collection Calculation ===');
console.log(`Base Amount: ${billingAmount} - ${spareAmount} - ${travellingAmount} - ${bookingAmount} = ₹${calculation.breakdown.baseAmount}`);
console.log(`50% of Base Amount: ₹${calculation.breakdown.baseAmount} × 0.5 = ₹${calculation.calculatedAmount}`);
console.log(`Amount to deduct from vendor wallet: ₹${calculation.calculatedAmount}`);

// Also test the earning calculation for comparison
const earningCalculation = WalletCalculationService.calculateEarning({
  billingAmount,
  spareAmount,
  travellingAmount,
  bookingAmount,
  paymentMethod: 'cash',
  gstIncluded: false
});

console.log('\n=== Cash Earning Calculation (for comparison) ===');
console.log(`Base Amount: ${billingAmount} - ${spareAmount} - ${travellingAmount} - ${bookingAmount} = ₹${earningCalculation.breakdown.baseAmount}`);
console.log(`50% of Base Amount: ₹${earningCalculation.breakdown.baseAmount} × 0.5 = ₹${earningCalculation.breakdown.baseAmount * 0.5}`);
console.log(`Plus Spare + Travel + Booking: ₹${earningCalculation.breakdown.baseAmount * 0.5} + ${spareAmount} + ${travellingAmount} + ${bookingAmount} = ₹${earningCalculation.calculatedAmount}`);
console.log(`Amount to add to vendor wallet: ₹${earningCalculation.calculatedAmount}`);

console.log('\n=== Summary ===');
console.log(`Vendor wallet deduction (cash collection): ₹${calculation.calculatedAmount}`);
console.log(`Vendor wallet earning (cash payment): ₹${earningCalculation.calculatedAmount}`);
console.log(`Net effect on vendor wallet: ₹${earningCalculation.calculatedAmount - calculation.calculatedAmount}`);
