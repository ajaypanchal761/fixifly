# Vendor Wallet Management System

## Overview
The Vendor Wallet Management System is a comprehensive solution for managing vendor earnings, penalties, and transactions according to the specified business rules.

## Database Model: VendorWallet

### Schema Structure
```javascript
{
  vendorId: String (unique, required),
  currentBalance: Number (default: 0),
  securityDeposit: Number (default: 3999, min: 3999),
  availableBalance: Number (calculated: currentBalance - securityDeposit),
  totalEarnings: Number (default: 0),
  totalPenalties: Number (default: 0),
  totalWithdrawals: Number (default: 0),
  totalDeposits: Number (default: 0),
  totalTaskAcceptanceFees: Number (default: 0),
  totalCashCollections: Number (default: 0),
  totalRefunds: Number (default: 0),
  // Statistics
  totalTasksCompleted: Number (default: 0),
  totalTasksRejected: Number (default: 0),
  totalTasksCancelled: Number (default: 0),
  totalRejectionPenalties: Number (default: 0),
  totalCancellationPenalties: Number (default: 0),
  // Monthly tracking
  monthlyEarnings: [{
    year: Number,
    month: Number,
    amount: Number
  }],
  lastTransactionAt: Date,
  isActive: Boolean (default: true),
  transactions: [WalletTransaction]
}
```

## Business Rules Implementation

### 1. Payment Calculation Rules

#### Online Payment
- **Formula**: `(Billing Amount - Spare Amount - Travel Amount) × 50% + Spare Amount + Travel Amount`
- **GST Included**: `(Billing Amount - 18% GST - Spare Amount - Travel Amount) × 50% + Spare Amount + Travel Amount`
- **Special Case (≤500)**: `Billing Amount - ₹20`

#### Cash Payment
- **Formula**: `(Billing Amount - Spare Amount - Travel Amount) × 50%`
- **GST Included**: `(Billing Amount - 18% GST - Spare Amount - Travel Amount) × 50% + GST Amount`
- **Special Case (≤500)**: `Billing Amount` (full amount)

### 2. Security Deposit
- **Amount**: ₹3,999 (non-withdrawable)
- **Purpose**: Security deposit for vendor account
- **Rule**: Available balance = Current balance - Security deposit

### 3. Penalty System

#### Task Rejection Penalty
- **Amount**: ₹100
- **Trigger**: When vendor rejects a task in their area
- **Counter**: `totalTasksRejected`, `totalRejectionPenalties`

#### Task Cancellation Penalty
- **Amount**: ₹100
- **Trigger**: When vendor cancels an accepted task
- **Counter**: `totalTasksCancelled`, `totalCancellationPenalties`
- **Refund**: Admin can refund if not vendor's fault

### 4. Task Acceptance Fees
- **Amount**: Variable (set by admin as MRP)
- **Trigger**: When vendor accepts a task
- **Validation**: Must have sufficient balance
- **Counter**: `totalTaskAcceptanceFees`

### 5. Cash Collection Deduction
- **Purpose**: Deduct amount when vendor collects cash
- **Calculation**: Same as earning calculation but deducted from wallet
- **Verification**: Requires cash payment confirmation

## API Endpoints

### Vendor Wallet Routes (`/api/vendor/wallet`)

#### GET `/`
- **Purpose**: Get vendor wallet details
- **Response**: Wallet summary, recent transactions
- **Auth**: Vendor token required

#### GET `/transactions`
- **Purpose**: Get transaction history
- **Query Params**: `page`, `limit`, `type`, `status`, `startDate`, `endDate`
- **Response**: Paginated transactions

#### GET `/statistics`
- **Purpose**: Get wallet statistics
- **Query Params**: `period` (monthly/yearly)
- **Response**: Comprehensive statistics

#### POST `/earning`
- **Purpose**: Add earning to wallet
- **Body**: `caseId`, `billingAmount`, `spareAmount`, `travellingAmount`, `paymentMethod`, `gstIncluded`, `description`, `cashVerification`, `cashPhoto`
- **Validation**: Cash payment verification required

#### POST `/penalty`
- **Purpose**: Add penalty to wallet
- **Body**: `caseId`, `type`, `amount`, `description`
- **Types**: `rejection`, `cancellation`

#### POST `/task-fee`
- **Purpose**: Add task acceptance fee
- **Body**: `caseId`, `taskMRP`, `description`
- **Validation**: Sufficient balance check

#### POST `/cash-collection`
- **Purpose**: Add cash collection deduction
- **Body**: `caseId`, `billingAmount`, `spareAmount`, `travellingAmount`, `gstIncluded`, `description`, `cashVerification`, `cashPhoto`
- **Validation**: Cash payment verification required

#### POST `/deposit`
- **Purpose**: Add deposit to wallet
- **Body**: `amount`, `description`

#### POST `/withdrawal`
- **Purpose**: Request withdrawal
- **Body**: `amount`, `description`
- **Validation**: Available balance check (excludes security deposit)

## Verification System

### Cash Payment Verification
1. **Warning Popup**: Confirms cash payment with fraud warning
2. **Confirmation Step**: Final confirmation with case details
3. **Photo Upload**: Optional cash photo for verification
4. **Audit Logging**: All cash payments logged for audit

### Photo Verification
1. **Warning Popup**: Confirms original photo upload
2. **Confirmation Step**: Final confirmation
3. **Audit Logging**: All photo uploads logged

## Frontend Components

### CashPaymentVerificationModal
- **Purpose**: Handle cash payment verification flow
- **Features**: Multi-step verification, photo upload, fraud warnings
- **Props**: `isOpen`, `onClose`, `onConfirm`, `billingAmount`, `caseId`

### PhotoVerificationModal
- **Purpose**: Handle photo upload verification
- **Features**: Original photo confirmation, fraud warnings
- **Props**: `isOpen`, `onClose`, `onConfirm`, `caseId`

### VendorWalletService
- **Purpose**: Frontend service for wallet operations
- **Features**: Type-safe API calls, utility methods, error handling
- **Methods**: All wallet operations with proper TypeScript types

## Security Features

### 1. Verification Middleware
- **Cash Payment**: Requires confirmation for cash transactions
- **Photo Upload**: Requires confirmation for photo uploads
- **Balance Check**: Validates sufficient balance for fees/penalties

### 2. Audit Logging
- **All Transactions**: Logged with vendor ID, amount, type
- **Cash Payments**: Special logging with verification status
- **Photo Uploads**: Logged with verification status

### 3. Fraud Prevention
- **Warning Messages**: Clear fraud warnings in UI
- **Verification Steps**: Multi-step confirmation process
- **Audit Trail**: Complete transaction history

## Usage Examples

### Adding Earning (Online Payment)
```javascript
const earning = await vendorWalletService.addEarning({
  caseId: 'CASE-2024-001',
  billingAmount: 1000,
  spareAmount: 200,
  travellingAmount: 100,
  paymentMethod: 'online',
  gstIncluded: false,
  description: 'Laptop repair service'
});
// Result: (1000 - 200 - 100) * 0.5 + 200 + 100 = 650
```

### Adding Earning (Cash Payment with GST)
```javascript
const earning = await vendorWalletService.addEarning({
  caseId: 'CASE-2024-002',
  billingAmount: 1000,
  spareAmount: 200,
  travellingAmount: 100,
  paymentMethod: 'cash',
  gstIncluded: true,
  description: 'Mobile repair service',
  cashVerification: 'confirmed',
  cashPhoto: 'base64_image_data'
});
// Result: (820 - 200 - 100) * 0.5 + 180 = 440
```

### Adding Penalty
```javascript
const penalty = await vendorWalletService.addPenalty({
  caseId: 'CASE-2024-003',
  type: 'rejection',
  amount: 100,
  description: 'Task rejected in vendor area'
});
```

### Task Acceptance Fee
```javascript
const fee = await vendorWalletService.addTaskAcceptanceFee({
  caseId: 'CASE-2024-004',
  taskMRP: 50,
  description: 'Task acceptance fee'
});
```

## Error Handling

### Common Error Types
- `CASH_VERIFICATION_REQUIRED`: Cash payment needs verification
- `PHOTO_VERIFICATION_REQUIRED`: Photo upload needs verification
- `INSUFFICIENT_BALANCE`: Not enough balance for operation
- `WALLET_NOT_FOUND`: Vendor wallet doesn't exist
- `INVALID_PAYMENT_METHOD`: Invalid payment method

### Error Response Format
```javascript
{
  success: false,
  message: "Error description",
  error: "ERROR_CODE",
  details: {
    // Additional error details
  }
}
```

## Monitoring and Analytics

### Key Metrics
- Total earnings by vendor
- Penalty frequency and amounts
- Task completion rates
- Cash vs online payment ratios
- Monthly earning trends

### Dashboard Data
- Current balance and available balance
- Transaction history with filtering
- Monthly/yearly statistics
- Success rates and performance metrics

## Future Enhancements

### Planned Features
1. **Automated Refunds**: Admin-triggered penalty refunds
2. **Bulk Operations**: Batch transaction processing
3. **Advanced Analytics**: Detailed reporting and insights
4. **Notification System**: Real-time wallet updates
5. **Integration**: Payment gateway integration for deposits/withdrawals

### Scalability Considerations
- Database indexing on vendorId and transaction dates
- Pagination for large transaction histories
- Caching for frequently accessed wallet data
- Background job processing for bulk operations















