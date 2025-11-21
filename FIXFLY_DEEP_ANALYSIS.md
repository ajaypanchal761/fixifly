# 🔍 FIXFLY PROJECT - DEEP ANALYSIS REPORT

## 📋 EXECUTIVE SUMMARY

**Fixfly** एक comprehensive service marketplace platform है जो IT और Home Appliance repair services provide करता है। यह एक full-stack application है जिसमें:
- **Backend**: Node.js + Express + MongoDB
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Payment Gateway**: Razorpay
- **Notifications**: Firebase Cloud Messaging (FCM)
- **SMS/WhatsApp**: SMS India Hub + Botbee

---

## 🏗️ ARCHITECTURE OVERVIEW

### Tech Stack

#### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 5.1.0
- **Database**: MongoDB Atlas (Mongoose 8.18.1)
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer + Cloudinary
- **Payment**: Razorpay SDK
- **Push Notifications**: Firebase Admin SDK
- **Email**: Nodemailer
- **SMS**: SMS India Hub API
- **WhatsApp**: Botbee API

#### Frontend
- **Framework**: React 18.3.1
- **Language**: TypeScript 5.8.3
- **Build Tool**: Vite 5.4.20
- **UI Library**: shadcn/ui (Radix UI components)
- **Styling**: Tailwind CSS 3.4.17
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM 6.30.1
- **Forms**: React Hook Form + Zod validation

---

## 👥 USER ROLES & PERMISSIONS

### 1. **User (Customer)**
- Service booking कर सकता है
- Payment कर सकता है (Online/Cash)
- Bookings track कर सकता है
- Reviews/ratings दे सकता है
- AMC plans subscribe कर सकता है
- Support tickets create कर सकता है

### 2. **Vendor (Service Provider)**
- Tasks accept/decline कर सकता है
- Tasks complete कर सकता है
- Wallet management (earnings, penalties, withdrawals)
- Mandatory deposit requirement (₹2000 after first task)
- Task acceptance fees
- Cash collection deductions
- Profile management

### 3. **Admin**
- Complete system management
- User/Vendor management
- Booking assignment
- Product/Service management
- Wallet management
- Push notifications
- Blog/Banner management
- AMC management
- Support ticket management

---

## 📊 DATA MODELS

### Core Models

#### 1. **User Model**
```javascript
- Basic Info: name, email, phone, role
- Authentication: isPhoneVerified, isEmailVerified, otp
- Profile: profileImage, address (street, city, state, pincode, landmark)
- Status: isActive, isBlocked
- Preferences: notifications (email, sms, push), language
- Statistics: totalBookings, completedBookings, cancelledBookings, totalSpent
- FCM Tokens: fcmTokens (web), fcmTokenMobile (mobile)
```

#### 2. **Vendor Model**
```javascript
- Personal: firstName, lastName, email, phone, alternatePhone, fatherName, homePhone
- Business: vendorId (3-digit unique), serviceCategories, experience
- Location: address, serviceLocations (from-to areas)
- Verification: isApproved, isVerifiedPartner, verificationStatus, verificationPayment (₹3999)
- Wallet: currentBalance, hasInitialDeposit, hasMandatoryDeposit (₹2000), canAcceptTasks
- Documents: aadhaarFront, aadhaarBack, panCard, bankDetails
- Rating: average, totalReviews, ratingDistribution
- Statistics: totalTasks, completedTasks, cancelledTasks, totalEarnings
```

#### 3. **Booking Model**
```javascript
- Customer: name, email, phone, address
- Services: array of {serviceId, serviceName, price}
- Pricing: subtotal, serviceFee, totalAmount
- Status: pending, waiting_for_engineer, confirmed, in_progress, completed, cancelled, declined
- Payment: status, method, transactionId, razorpayOrderId, razorpayPaymentId
- Scheduling: preferredDate, preferredTimeSlot, scheduledDate, scheduledTime
- Vendor: vendorId, assignedAt, autoRejectAt (10 minutes timer)
- VendorResponse: status (pending/accepted/declined), respondedAt, responseNote
- CompletionData: resolutionNote, billingAmount, spareParts, travelingAmount, paymentMethod
- CancellationData: isCancelled, cancelledBy, cancellationReason
- RescheduleData: isRescheduled, originalDate, rescheduledDate, reason
```

#### 4. **VendorWallet Model**
```javascript
- Balance: currentBalance, securityDeposit (₹3999), availableBalance
- Statistics: totalEarnings, totalPenalties, totalWithdrawals, totalDeposits
- Transaction Types: earning, penalty, deposit, withdrawal, task_acceptance_fee, cash_collection, refund
- Monthly Tracking: monthlyEarnings array
- Transactions: embedded array of wallet transactions
```

#### 5. **Product Model**
```javascript
- Basic: productName, productImage, serviceType (IT Needs / Home Appliance)
- Categories: A (Basic), B (Premium), C (Emergency), D (Maintenance)
- Services: Each category contains array of services with name, description, price, discountPrice
- Status: draft, active, inactive, archived
- Featured: isFeatured flag
```

---

## 🔄 KEY BUSINESS LOGIC FLOWS

### 1. **Booking Flow**

#### Step 1: User Creates Booking
```
User selects services → Fills customer details → Selects date/time → Payment
```

#### Step 2: Payment Processing
- **Online Payment**: Razorpay integration → Payment verification → Booking created
- **Cash Payment**: Booking created with payment status "pending"

#### Step 3: Admin Assignment
- Admin assigns vendor to booking
- `autoRejectAt` timer set (10 minutes from assignment)
- Booking status → "confirmed"
- Vendor receives notification

#### Step 4: Vendor Response
- **Accept**: Status → "in_progress", autoRejectAt cleared
- **Decline**: ₹100 penalty, status → "waiting_for_engineer", vendor removed
- **Auto-Reject**: If no response in 10 minutes, ₹100 penalty, status → "waiting_for_engineer"

#### Step 5: Task Completion
- Vendor completes task with:
  - Resolution note
  - Billing amount
  - Spare parts (with photos)
  - Traveling amount
  - Payment method (online/cash)
  - GST inclusion flag

#### Step 6: Payment Collection
- **Cash**: Deduction from vendor wallet (50% of base amount)
- **Online**: User pays → Vendor earning added (50% of base + spare + travel + booking)

#### Step 7: Vendor Earning Calculation
```
For amounts > ₹500:
  Base = billingAmount - spareAmount - travelingAmount - bookingAmount
  Vendor Earning = (Base * 50%) + spareAmount + travelingAmount + bookingAmount

For amounts <= ₹500:
  Online: billingAmount - ₹20
  Cash: billingAmount (full)
```

### 2. **Vendor Wallet System**

#### Earning Types
1. **Task Completion Earning**
   - Calculated based on payment method
   - Added when online payment is verified or cash task completed

2. **Penalties**
   - Task Rejection: ₹100
   - Task Cancellation: ₹100
   - Auto-Rejection: ₹100

3. **Task Acceptance Fee**
   - Deducted when vendor accepts task
   - Amount = Task MRP

4. **Cash Collection Deduction**
   - For cash payments: 50% of base amount deducted
   - Base = billingAmount - spare - travel - booking

5. **Deposits**
   - Initial deposit: Any amount
   - Mandatory deposit: ₹2000 (required after first task assignment)

6. **Withdrawals**
   - Available balance = currentBalance - securityDeposit (₹3999)
   - Admin approval required

### 3. **Auto-Reject System**

#### Mechanism
- Service runs every 60 seconds
- Checks bookings with:
  - `vendorResponse.status = 'pending'`
  - `vendor.autoRejectAt <= now`
  - `vendor.vendorId` exists

#### Actions
1. Apply ₹100 penalty to vendor wallet
2. Update booking:
   - `vendorResponse.status = 'declined'`
   - `status = 'waiting_for_engineer'`
   - Remove vendor assignment
   - Clear autoRejectAt

### 4. **Mandatory Deposit System**

#### Flow
1. Vendor gets first task assignment
2. `firstTaskAssignedAt` timestamp set
3. `canAcceptTasks = false`
4. Vendor must deposit ₹2000
5. After deposit: `hasMandatoryDeposit = true`, `canAcceptTasks = true`

#### Validation
- Before accepting task, system checks `canAcceptNewTasks()`
- Returns error if mandatory deposit not completed

### 5. **Authentication Flow**

#### User Authentication
1. User enters phone number
2. System sends OTP via SMS (SMS India Hub)
3. User enters OTP
4. System verifies OTP (10-minute expiry)
5. JWT token generated (30-day expiry)
6. FCM token saved (web/mobile detection)

#### Vendor Authentication
- Email/Password based
- Admin approval required (`isActive = false` by default)
- Verification payment required (₹3999)

---

## 💳 PAYMENT INTEGRATION

### Razorpay Integration

#### Order Creation
```javascript
Amount in Rupees → Convert to Paise (×100)
Create order with receipt, notes
Return order_id to frontend
```

#### Payment Verification
1. **Signature Verification** (Primary)
   ```javascript
   body = order_id + "|" + payment_id
   signature = HMAC-SHA256(body, secret_key)
   ```

2. **API Verification** (Fallback for WebView/APK)
   ```javascript
   Fetch payment from Razorpay API
   Check payment.status === 'captured'
   Verify order_id matches
   ```

#### Payment Modes
- **Web**: Modal checkout
- **WebView/APK**: Redirect mode with callback URL

### Payment Scenarios

1. **Booking Payment** (Initial)
   - User pays during booking creation
   - Payment verified → Booking created with status "waiting_for_engineer"

2. **Spare Parts Payment** (After completion)
   - Vendor completes task with spare parts
   - User pays for spare parts + billing amount
   - Payment verified → Booking status "completed"
   - Vendor earning added to wallet

---

## 🔔 NOTIFICATION SYSTEM

### Push Notifications (Firebase FCM)

#### Token Management
- **Web Tokens**: Stored in `fcmTokens` array (max 10)
- **Mobile Tokens**: Stored in `fcmTokenMobile` array (max 10)
- Platform detection based on user agent

#### Notification Types
1. **User Notifications**
   - Booking confirmation
   - Booking status updates
   - Payment reminders
   - Rating prompts

2. **Vendor Notifications**
   - New task assignment
   - Task updates
   - Wallet transactions
   - Penalty alerts

3. **Admin Notifications**
   - New bookings
   - Vendor activities
   - System alerts

### SMS/WhatsApp Notifications

#### SMS (SMS India Hub)
- OTP delivery
- Booking confirmations
- Status updates

#### WhatsApp (Botbee)
- Booking confirmations to users
- Booking notifications to admin
- Template-based messages

---

## 🛠️ SERVICES & INTEGRATIONS

### Backend Services

1. **razorpayService.js**
   - Order creation
   - Payment verification
   - Refund processing
   - Payment details fetching

2. **autoRejectService.js**
   - Background service (runs every 60 seconds)
   - Auto-rejects pending assignments
   - Applies penalties

3. **walletCalculationService.js**
   - Earning calculations
   - Cash collection deductions
   - Transaction validation
   - Monthly statistics

4. **firebasePushService.js**
   - FCM token management
   - Push notification sending
   - Multi-platform support

5. **smsService.js**
   - SMS India Hub integration
   - OTP sending
   - Template management

6. **botbeeService.js**
   - WhatsApp messaging
   - Template-based messages
   - Booking confirmations

7. **emailService.js**
   - Nodemailer integration
   - Email templates
   - SMTP configuration

---

## 📱 FRONTEND STRUCTURE

### Key Pages

1. **User Pages**
   - `Index.tsx`: Home page with services
   - `Booking.tsx`: Booking management
   - `Checkout.tsx`: Payment checkout
   - `Profile.tsx`: User profile
   - `ProductDetail.tsx`: Service details
   - `AMC.tsx`: AMC plans
   - `Support.tsx`: Support tickets

2. **Vendor Pages**
   - `VendorDashboard.tsx`: Task overview
   - `VendorTaskDetail.tsx`: Task details
   - `VendorEarnings.tsx`: Wallet & earnings
   - `VendorProfile.tsx`: Profile management

3. **Admin Pages**
   - `AdminDashboard.tsx`: Analytics
   - `AdminBookingManagement.tsx`: Booking assignment
   - `AdminVendorManagement.tsx`: Vendor management
   - `AdminServiceManagement.tsx`: Product/service management
   - `AdminWalletManagement.tsx`: Wallet operations

### Key Components

1. **Payment Components**
   - `razorpayService.ts`: Payment processing
   - `PaymentCallback.tsx`: Payment redirect handling

2. **Booking Components**
   - `ServiceBookingModal.tsx`: Service selection
   - `RatingPopup.tsx`: Post-completion rating

3. **Vendor Components**
   - `VendorTaskCard.tsx`: Task display
   - `CashPaymentVerificationModal.tsx`: Cash verification

---

## 🔐 SECURITY FEATURES

1. **Authentication**
   - JWT tokens (30-day expiry)
   - OTP verification (10-minute expiry)
   - Role-based access control

2. **Payment Security**
   - Razorpay signature verification
   - API fallback verification
   - Transaction logging

3. **Data Validation**
   - Mongoose schema validation
   - Zod validation (frontend)
   - Input sanitization

4. **Error Handling**
   - Global error handlers
   - Try-catch blocks
   - Error logging

---

## 📈 BUSINESS RULES

### Pricing Rules
1. **Service Fee**: ₹100 (default)
2. **GST**: 18% (if applicable)
3. **Vendor Commission**: 50% of base amount
4. **Special Case**: Amounts ≤ ₹500
   - Online: Full amount - ₹20
   - Cash: Full amount

### Penalty Rules
1. **Task Rejection**: ₹100
2. **Task Cancellation**: ₹100
3. **Auto-Rejection**: ₹100

### Deposit Rules
1. **Security Deposit**: ₹3999 (non-withdrawable)
2. **Mandatory Deposit**: ₹2000 (after first task)
3. **Verification Payment**: ₹3999 (vendor registration)

### Time Rules
1. **OTP Expiry**: 10 minutes
2. **Auto-Reject Timer**: 10 minutes
3. **Reschedule Minimum**: 2 hours from now

---

## 🗄️ DATABASE STRUCTURE

### MongoDB Collections

1. **users**: Customer data
2. **vendors**: Service provider data
3. **bookings**: Service bookings
4. **vendorwallets**: Vendor financial data
5. **products**: Service products
6. **reviews**: Customer reviews
7. **amcplans**: AMC subscription plans
8. **amcsubscriptions**: User AMC subscriptions
9. **supporttickets**: Support requests
10. **warrantyclaims**: Warranty claims
11. **blogs**: Blog posts
12. **banners**: Banner ads
13. **cities**: Service locations
14. **cards**: Payment cards
15. **withdrawalrequests**: Vendor withdrawal requests

### Indexes
- Email, phone (unique)
- Status, dates (for queries)
- Vendor ID, booking reference (for lookups)

---

## 🔧 CONFIGURATION

### Environment Variables

#### Backend (`production.env`)
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=ajaypanchal761
JWT_EXPIRES_IN=30d
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
CLOUDINARY_CLOUD_NAME=fixfly
FIREBASE_PROJECT_ID=fixfly-d8e35
SMSINDIAHUB_API_KEY=...
BOTBEE_API_KEY=...
```

#### Frontend
```env
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=rzp_test_...
```

---

## 🚀 DEPLOYMENT

### Backend
- Port: 5000 (default)
- Health check: `/health`
- CORS: Configured for multiple origins

### Frontend
- Vite dev server: Port 8080/8081/5173
- Production: Vercel (`getfixfly.com`)
- Build: `vite build`

---

## 📝 KEY FEATURES

### User Features
✅ Service booking (IT & Home Appliance)
✅ Multiple payment methods (Online/Cash)
✅ Booking tracking
✅ AMC subscriptions
✅ Reviews & ratings
✅ Support tickets
✅ Push notifications
✅ Profile management

### Vendor Features
✅ Task management (accept/decline/complete)
✅ Wallet system (earnings, penalties, withdrawals)
✅ Mandatory deposit system
✅ Cash collection handling
✅ Task acceptance fees
✅ Profile management
✅ Earnings tracking

### Admin Features
✅ Complete booking management
✅ Vendor assignment
✅ User/Vendor management
✅ Product/Service management
✅ Wallet management
✅ Push notification broadcasting
✅ Blog/Banner management
✅ AMC management
✅ Support ticket management
✅ Analytics & reports

---

## ⚠️ KNOWN ISSUES & CONSIDERATIONS

1. **SMS India Hub**: Template approval pending (Error Code: 006)
2. **First-time User Discount**: Feature disabled
3. **Auto-Reject Service**: Runs every 60 seconds (could be optimized)
4. **Payment Verification**: Signature verification sometimes fails in WebView (has API fallback)
5. **FCM Token Management**: Separate arrays for web/mobile (could be unified)

---

## 🔄 RECENT CHANGES (Git Status)

### Modified Files
- `backend/controllers/paymentController.js`
- `backend/routes/payment.js`
- `frontend/src/App.tsx`
- `frontend/src/pages/Booking.tsx`
- `frontend/src/services/razorpayService.ts`

### New Files
- `frontend/src/pages/PaymentCallback.tsx`
- `frontend/src/utils/mobileAppBridge.ts`
- `backend/deploy.sh`
- `backend/install-dependencies.sh`

---

## 📊 STATISTICS & METRICS

### User Statistics
- Total bookings
- Completed bookings
- Cancelled bookings
- Total spent

### Vendor Statistics
- Total tasks
- Completed tasks
- Cancelled tasks
- Total earnings
- Total penalties
- Rejection rate

### System Statistics
- Total bookings
- Revenue
- Active vendors
- Active users

---

## 🎯 CONCLUSION

Fixfly एक comprehensive और well-structured service marketplace platform है जो:
- ✅ Multiple user roles support करता है
- ✅ Complex payment flows handle करता है
- ✅ Real-time notifications provide करता है
- ✅ Sophisticated wallet system है
- ✅ Auto-rejection mechanism है
- ✅ Mandatory deposit system है
- ✅ Multi-platform support (Web/Mobile) है

Platform production-ready है और continuous improvements के लिए तैयार है।

---

**Analysis Date**: 2025-01-21
**Analyzed By**: AI Assistant
**Project Status**: Active Development

