# Web vs App Payment API Comparison

## ✅ Same APIs (Web aur App dono ke liye same)

### 1. Create Razorpay Order
**Endpoint:** `POST /api/payment/create-order`

**Used by:**
- ✅ Web (Payment.tsx, Support.tsx, Checkout.tsx)
- ✅ App (Same endpoints)

**Request Body:**
```json
{
  "amount": 1000,
  "currency": "INR",
  "receipt": "receipt_123",
  "notes": {
    "ticketId": "TKT001",
    "type": "support_ticket"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "order_xxxxxxxxxxxxx",
    "amount": 100000,
    "currency": "INR",
    "status": "created"
  }
}
```

---

### 2. Get Payment Details
**Endpoint:** `GET /api/payment/:paymentId`

**Used by:**
- ✅ Web
- ✅ App

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "pay_xxxxxxxxxxxxx",
    "amount": 100000,
    "status": "captured"
  }
}
```

---

## ⚠️ Different APIs (Purpose ke hisaab se)

### 3. Verify Payment - General
**Endpoint:** `POST /api/payment/verify`

**Used by:**
- ✅ Web: `Payment.tsx` (General payments)
- ✅ App: Same endpoint

**Request Body:**
```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx",
  "ticketId": "TKT001",
  "amount": 1000
}
```

**Features:**
- Signature verification
- Updates support ticket (if ticketId provided)
- Credits vendor wallet (if applicable)

---

### 4. Verify Payment - Support Tickets (Specific)
**Endpoint:** `POST /api/support-tickets/payment/verify`

**Used by:**
- ✅ Web: `Support.tsx` (Support ticket payments)
- ✅ App: Same endpoint

**Request Body:**
```json
{
  "ticketId": "TKT001",
  "razorpayOrderId": "order_xxx",
  "razorpayPaymentId": "pay_xxx",
  "razorpaySignature": "signature_xxx"
}
```

**Features:**
- Signature verification
- Updates support ticket status
- Credits vendor wallet
- Sends notification emails
- **Additional:** Support ticket specific logic

**Note:** Field names slightly different:
- `razorpayOrderId` (camelCase) vs `razorpay_order_id` (snake_case)
- `razorpayPaymentId` (camelCase) vs `razorpay_payment_id` (snake_case)

---

## 📊 Summary Table

| API Endpoint | Web | App | Purpose |
|-------------|-----|-----|---------|
| `POST /api/payment/create-order` | ✅ | ✅ | Create order (same) |
| `POST /api/payment/verify` | ✅ | ✅ | General payment verification |
| `POST /api/support-tickets/payment/verify` | ✅ | ✅ | Support ticket payment verification |
| `GET /api/payment/:paymentId` | ✅ | ✅ | Get payment details (same) |

---

## 🔍 Key Differences

### 1. **Verify Payment Endpoints**

**General Payment Verify** (`/api/payment/verify`):
- Used for: General payments, bookings, AMC subscriptions
- Field names: `razorpay_order_id`, `razorpay_payment_id` (snake_case)
- Updates: Support ticket (optional), vendor wallet (optional)

**Support Ticket Verify** (`/api/support-tickets/payment/verify`):
- Used for: Support ticket payments only
- Field names: `razorpayOrderId`, `razorpayPaymentId` (camelCase)
- Updates: Support ticket (required), vendor wallet, sends emails

### 2. **Why Two Different Endpoints?**

1. **Support Ticket Specific Logic:**
   - Support tickets have specific business logic
   - Need to update ticket status, send emails
   - Vendor wallet credit calculation is different

2. **Field Naming Convention:**
   - General endpoint uses snake_case (Razorpay standard)
   - Support ticket endpoint uses camelCase (Frontend convention)

3. **Error Handling:**
   - Support ticket endpoint has more specific error messages
   - Better logging for support ticket payments

---

## 💡 Best Practice

### For Web:
- Use `/api/payment/create-order` for all payment types
- Use `/api/payment/verify` for general payments
- Use `/api/support-tickets/payment/verify` for support tickets

### For App:
- **Same as Web** - Use same endpoints
- No difference in API calls
- Only difference is in frontend implementation (mobile detection, retry logic)

---

## 🧪 Testing in Postman

### Test 1: Create Order (Web/App Same)
```http
POST http://localhost:5000/api/payment/create-order
Content-Type: application/json

{
  "amount": 1000,
  "currency": "INR",
  "receipt": "test_001"
}
```

### Test 2: Verify Payment - General (Web/App Same)
```http
POST http://localhost:5000/api/payment/verify
Content-Type: application/json

{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx",
  "amount": 1000
}
```

### Test 3: Verify Payment - Support Ticket (Web/App Same)
```http
POST http://localhost:5000/api/support-tickets/payment/verify
Content-Type: application/json

{
  "ticketId": "TKT001",
  "razorpayOrderId": "order_xxx",
  "razorpayPaymentId": "pay_xxx",
  "razorpaySignature": "signature_xxx"
}
```

---

## ✅ Conclusion

**Web aur App dono ke liye same backend APIs use hote hain!**

**Differences:**
1. ✅ **Create Order** - Same API
2. ✅ **Get Payment Details** - Same API
3. ⚠️ **Verify Payment** - Two endpoints (purpose ke hisaab se)
   - General: `/api/payment/verify`
   - Support Tickets: `/api/support-tickets/payment/verify`

**Frontend Implementation:**
- Web: Direct API calls
- App: Same API calls + Mobile detection + Retry logic

**Backend:**
- Same controllers
- Same business logic
- Same Razorpay integration

---

## 📝 Notes

1. **Amount Format:** Dono cases mein amount **rupees** mein bhejna hai (backend paise mein convert karega)

2. **Signature Verification:** Dono endpoints signature verify karte hain (same logic)

3. **Mobile App:** Mobile app bhi same APIs use karta hai, bas frontend mein mobile detection aur retry logic add kiya gaya hai

4. **Postman Testing:** Postman mein dono endpoints test kar sakte hain (same base URL)

