# Razorpay Payment Gateway - Postman Testing Guide

## Base URL
```
http://localhost:5000/api
```

## Environment Variables Required
- `RAZORPAY_KEY_ID`: Your Razorpay Key ID
- `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret

---

## API Endpoints

### 1. Create Razorpay Order
**Endpoint:** `POST /api/payment/create-order`

**Description:** Creates a new Razorpay order for payment

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 1000,
  "currency": "INR",
  "receipt": "receipt_1234567890",
  "notes": {
    "ticketId": "TKT001",
    "type": "support_ticket",
    "description": "Payment for support ticket"
  }
}
```

**Request Body Fields:**
- `amount` (required): Amount in **Rupees** (will be converted to paise automatically)
- `currency` (optional): Currency code, default is "INR"
- `receipt` (optional): Receipt ID for tracking
- `notes` (optional): Additional notes/metadata

**Success Response (200):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "order_xxxxxxxxxxxxx",
    "entity": "order",
    "amount": 100000,
    "amount_paid": 0,
    "amount_due": 100000,
    "currency": "INR",
    "receipt": "receipt_1234567890",
    "status": "created",
    "attempts": 0,
    "notes": {
      "ticketId": "TKT001",
      "type": "support_ticket",
      "description": "Payment for support ticket"
    },
    "created_at": 1234567890
  }
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "message": "Invalid amount",
  "error": "Error message here"
}
```

---

### 2. Verify Payment
**Endpoint:** `POST /api/payment/verify`

**Description:** Verifies Razorpay payment signature and updates payment status

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "razorpay_order_id": "order_xxxxxxxxxxxxx",
  "razorpay_payment_id": "pay_xxxxxxxxxxxxx",
  "razorpay_signature": "signature_xxxxxxxxxxxxx",
  "ticketId": "TKT001",
  "amount": 1000
}
```

**Request Body Fields:**
- `razorpay_order_id` (required): Order ID from Razorpay
- `razorpay_payment_id` (required): Payment ID from Razorpay
- `razorpay_signature` (required): Payment signature from Razorpay
- `ticketId` (optional): Support ticket ID (if applicable)
- `amount` (optional): Payment amount

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "paymentId": "pay_xxxxxxxxxxxxx",
    "orderId": "order_xxxxxxxxxxxxx",
    "amount": 1000
  }
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "message": "Invalid payment signature",
  "error": "Error message here"
}
```

---

### 3. Get Payment Details
**Endpoint:** `GET /api/payment/:paymentId`

**Description:** Fetches payment details from Razorpay

**URL Parameters:**
- `paymentId`: Razorpay Payment ID (e.g., `pay_xxxxxxxxxxxxx`)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "pay_xxxxxxxxxxxxx",
    "entity": "payment",
    "amount": 100000,
    "currency": "INR",
    "status": "captured",
    "order_id": "order_xxxxxxxxxxxxx",
    "method": "card",
    "description": "Payment description",
    "created_at": 1234567890,
    "captured_at": 1234567890
  }
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "message": "Failed to fetch payment details",
  "error": "Error message here"
}
```

---

## Postman Collection Setup

### Step 1: Create Environment Variables
1. Open Postman
2. Click on "Environments" → "Create Environment"
3. Add these variables:
   - `base_url`: `http://localhost:5000/api`
   - `razorpay_order_id`: (will be set after creating order)
   - `razorpay_payment_id`: (will be set after payment)
   - `razorpay_signature`: (will be set after payment)

### Step 2: Create Collection
1. Create a new collection named "Fixfly Payment APIs"
2. Add the following requests:

---

## Test Cases

### Test Case 1: Create Order (Success)
**Request:**
```http
POST {{base_url}}/payment/create-order
Content-Type: application/json

{
  "amount": 1000,
  "currency": "INR",
  "receipt": "test_receipt_001",
  "notes": {
    "test": "true",
    "description": "Test payment order"
  }
}
```

**Expected:** Status 200, `success: true`, order ID in response

---

### Test Case 2: Create Order (Invalid Amount)
**Request:**
```http
POST {{base_url}}/payment/create-order
Content-Type: application/json

{
  "amount": -100,
  "currency": "INR"
}
```

**Expected:** Status 400, `success: false`, error message

---

### Test Case 3: Create Order (Missing Amount)
**Request:**
```http
POST {{base_url}}/payment/create-order
Content-Type: application/json

{
  "currency": "INR"
}
```

**Expected:** Status 400, `success: false`, error message

---

### Test Case 4: Verify Payment (Invalid Signature)
**Request:**
```http
POST {{base_url}}/payment/verify
Content-Type: application/json

{
  "razorpay_order_id": "order_xxxxxxxxxxxxx",
  "razorpay_payment_id": "pay_xxxxxxxxxxxxx",
  "razorpay_signature": "invalid_signature",
  "amount": 1000
}
```

**Expected:** Status 400, `success: false`, "Invalid payment signature"

---

### Test Case 5: Get Payment Details
**Request:**
```http
GET {{base_url}}/payment/pay_xxxxxxxxxxxxx
```

**Note:** Replace `pay_xxxxxxxxxxxxx` with actual payment ID from Razorpay dashboard

**Expected:** Status 200, payment details in response

---

## Testing Payment Flow (Complete)

### Step 1: Create Order
1. Use "Create Order" endpoint
2. Copy `order.id` from response
3. Save it as `razorpay_order_id` in environment

### Step 2: Make Payment (Frontend/App)
- Use the `order.id` in frontend to open Razorpay checkout
- Complete payment using test card:
  - **Card Number:** `4111 1111 1111 1111`
  - **CVV:** Any 3 digits
  - **Expiry:** Any future date
  - **Name:** Any name

### Step 3: Verify Payment
1. After payment, you'll get:
   - `razorpay_order_id`
   - `razorpay_payment_id`
   - `razorpay_signature`
2. Use "Verify Payment" endpoint with these values
3. Check if verification is successful

### Step 4: Get Payment Details
1. Use `razorpay_payment_id` from Step 3
2. Call "Get Payment Details" endpoint
3. Verify payment status is "captured"

---

## Test Card Details (Razorpay Test Mode)

### Success Card:
- **Card Number:** `4111 1111 1111 1111`
- **CVV:** `123`
- **Expiry:** `12/25`
- **Name:** `Test User`

### Failure Card:
- **Card Number:** `4000 0000 0000 0002`
- **CVV:** `123`
- **Expiry:** `12/25`
- **Name:** `Test User`

---

## Common Issues & Solutions

### Issue 1: "Invalid amount"
**Solution:** Ensure amount is a positive number (in rupees)

### Issue 2: "Invalid payment signature"
**Solution:** 
- Ensure you're using correct `RAZORPAY_KEY_SECRET`
- Verify all three values (order_id, payment_id, signature) are correct
- Check if signature is generated correctly

### Issue 3: "Failed to create order"
**Solution:**
- Check Razorpay credentials in `.env` file
- Verify Razorpay account is active
- Check network connectivity

### Issue 4: "Failed to fetch payment details"
**Solution:**
- Ensure payment ID is correct
- Check if payment exists in Razorpay dashboard
- Verify Razorpay credentials

---

## Postman Pre-request Script (Optional)

Add this to automatically set receipt ID:

```javascript
// Generate unique receipt ID
pm.environment.set("receipt_id", "receipt_" + Date.now());
```

---

## Postman Test Scripts

### For Create Order:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success field", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
});

pm.test("Order created successfully", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.eql(true);
    pm.expect(jsonData.data).to.have.property('id');
    
    // Save order ID for next request
    if (jsonData.data && jsonData.data.id) {
        pm.environment.set("razorpay_order_id", jsonData.data.id);
    }
});
```

### For Verify Payment:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Payment verified successfully", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.eql(true);
    pm.expect(jsonData.data).to.have.property('paymentId');
});
```

---

## Notes

1. **Amount Format:** Backend automatically converts rupees to paise (multiplies by 100)
2. **Test Mode:** Use Razorpay test keys for testing
3. **Production:** Switch to production keys before going live
4. **Signature Verification:** Always verify payment signature on backend
5. **Error Handling:** All endpoints return consistent error format

---

## Quick Test Commands (cURL)

### Create Order:
```bash
curl -X POST http://localhost:5000/api/payment/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "INR",
    "receipt": "test_001"
  }'
```

### Verify Payment:
```bash
curl -X POST http://localhost:5000/api/payment/verify \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_xxx",
    "razorpay_payment_id": "pay_xxx",
    "razorpay_signature": "signature_xxx"
  }'
```

### Get Payment Details:
```bash
curl -X GET http://localhost:5000/api/payment/pay_xxxxxxxxxxxxx
```

