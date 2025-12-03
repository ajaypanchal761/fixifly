# Booking API Documentation

Complete API documentation for Fixfly Booking Management System.

## Base URL

```
Development: http://localhost:5000/api
Production: https://your-backend-domain.com/api
```

---

## Table of Contents

1. [Quick Reference - All APIs](#quick-reference---all-apis)
2. [Public Booking Routes](#public-booking-routes)
3. [Vendor Booking Routes](#vendor-booking-routes)
4. [Admin Booking Routes](#admin-booking-routes)
5. [Payment Routes](#payment-routes)
6. [Response Formats](#response-formats)
7. [Error Handling](#error-handling)

---

## Quick Reference - All APIs

### Public Booking APIs

| # | Method | Endpoint | Full URL | Auth |
|---|--------|----------|----------|------|
| 1 | POST | `/api/bookings` | `http://localhost:5000/api/bookings` | No |
| 2 | POST | `/api/bookings/with-payment` | `http://localhost:5000/api/bookings/with-payment` | No |
| 3 | GET | `/api/bookings/:id` | `http://localhost:5000/api/bookings/:id` | Optional |
| 4 | GET | `/api/bookings/customer/:email` | `http://localhost:5000/api/bookings/customer/:email` | No |
| 5 | PATCH | `/api/bookings/:id/status` | `http://localhost:5000/api/bookings/:id/status` | No |
| 6 | GET | `/api/bookings/stats` | `http://localhost:5000/api/bookings/stats` | No |
| 7 | POST | `/api/bookings/check-first-time` | `http://localhost:5000/api/bookings/check-first-time` | No |
| 8 | GET | `/api/bookings/test` | `http://localhost:5000/api/bookings/test` | No |
| 9 | GET | `/api/bookings/test-auth` | `http://localhost:5000/api/bookings/test-auth` | Yes (Vendor) |

### Vendor Booking APIs

| # | Method | Endpoint | Full URL | Auth |
|---|--------|----------|----------|------|
| 10 | GET | `/api/bookings/vendor/me` | `http://localhost:5000/api/bookings/vendor/me` | Yes (Vendor) |
| 11 | GET | `/api/bookings/vendor/:vendorId` | `http://localhost:5000/api/bookings/vendor/:vendorId` | No |
| 12 | PATCH | `/api/bookings/:id/accept` | `http://localhost:5000/api/bookings/:id/accept` | Yes (Vendor) |
| 13 | PATCH | `/api/bookings/:id/decline` | `http://localhost:5000/api/bookings/:id/decline` | Yes (Vendor) |
| 14 | PATCH | `/api/bookings/:id/complete` | `http://localhost:5000/api/bookings/:id/complete` | Yes (Vendor) |
| 15 | PATCH | `/api/bookings/:id/cancel` | `http://localhost:5000/api/bookings/:id/cancel` | Yes (Vendor) |
| 16 | PATCH | `/api/bookings/:id/reschedule` | `http://localhost:5000/api/bookings/:id/reschedule` | Yes (Vendor) |

### User Booking APIs

| # | Method | Endpoint | Full URL | Auth |
|---|--------|----------|----------|------|
| 17 | PATCH | `/api/bookings/:id/cancel-by-user` | `http://localhost:5000/api/bookings/:id/cancel-by-user` | No |
| 18 | PATCH | `/api/bookings/:id/reschedule-by-user` | `http://localhost:5000/api/bookings/:id/reschedule-by-user` | No |

### Payment APIs

| # | Method | Endpoint | Full URL | Auth |
|---|--------|----------|----------|------|
| 19 | POST | `/api/bookings/payment/create-order` | `http://localhost:5000/api/bookings/payment/create-order` | No |
| 20 | POST | `/api/bookings/payment/verify` | `http://localhost:5000/api/bookings/payment/verify` | No |
| 21 | GET | `/api/bookings/payment/test-config` | `http://localhost:5000/api/bookings/payment/test-config` | No |

### Admin Booking APIs

| # | Method | Endpoint | Full URL | Auth |
|---|--------|----------|----------|------|
| 22 | GET | `/api/admin/bookings` | `http://localhost:5000/api/admin/bookings` | Yes (Admin) |
| 23 | GET | `/api/admin/bookings/:id` | `http://localhost:5000/api/admin/bookings/:id` | Yes (Admin) |
| 24 | PATCH | `/api/admin/bookings/:id/status` | `http://localhost:5000/api/admin/bookings/:id/status` | Yes (Admin) |
| 25 | PATCH | `/api/admin/bookings/:id/priority` | `http://localhost:5000/api/admin/bookings/:id/priority` | Yes (Admin) |
| 26 | PATCH | `/api/admin/bookings/:id/assign-vendor` | `http://localhost:5000/api/admin/bookings/:id/assign-vendor` | Yes (Admin) |
| 27 | POST | `/api/admin/bookings/:id/refund` | `http://localhost:5000/api/admin/bookings/:id/refund` | Yes (Admin) |
| 28 | GET | `/api/admin/bookings/stats` | `http://localhost:5000/api/admin/bookings/stats` | Yes (Admin) |
| 29 | DELETE | `/api/admin/bookings/:id` | `http://localhost:5000/api/admin/bookings/:id` | Yes (Admin) |

**Total APIs: 29**

---

## Public Booking Routes

### 1. Create Booking (Cash Payment)

Create a new booking with cash on delivery payment method.

**Endpoint:** `POST /api/bookings`

**Full URL:** `http://localhost:5000/api/bookings`

**Authentication:** Not required

**Request Body:**
```json
{
  "customer": {
    "name": "Ajay Panchal",
    "email": "panchalajay717@gmail.com",
    "phone": "7610416911",
    "address": {
      "street": "Nousrabad",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "455001"
    }
  },
  "services": [
    {
      "serviceId": "1",
      "serviceName": "Repair",
      "price": 299
    }
  ],
  "pricing": {
    "subtotal": 299,
    "serviceFee": 0,
    "gstAmount": 54,
    "totalAmount": 353
  },
  "scheduling": {
    "preferredDate": "2024-01-15",
    "preferredTimeSlot": "10:00 AM"
  },
  "notes": "Booking created from checkout",
  "payment": {
    "status": "pending",
    "method": "cash",
    "transactionId": "CASH_1234567890",
    "paidAt": null
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "bookingReference": "FIXD93ECC2B",
      "customer": {...},
      "services": [...],
      "pricing": {...},
      "status": "waiting_for_engineer",
      "payment": {
        "status": "pending",
        "method": "cash"
      },
      "createdAt": "2024-01-15T10:00:00.000Z"
    },
    "bookingReference": "FIXD93ECC2B"
  }
}
```

---

### 2. Create Booking with Payment (Online Payment)

Create a new booking with Razorpay payment verification.

**Endpoint:** `POST /api/bookings/with-payment`

**Full URL:** `http://localhost:5000/api/bookings/with-payment`

**Authentication:** Not required

**Request Body:**
```json
{
  "customer": {
    "name": "Ajay Panchal",
    "email": "panchalajay717@gmail.com",
    "phone": "7610416911",
    "address": {
      "street": "Nousrabad",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "455001"
    }
  },
  "services": [
    {
      "serviceId": "1",
      "serviceName": "Repair",
      "price": 299
    }
  ],
  "pricing": {
    "subtotal": 299,
    "serviceFee": 0,
    "gstAmount": 54,
    "totalAmount": 353
  },
  "scheduling": {
    "preferredDate": "2024-01-15",
    "preferredTimeSlot": "10:00 AM"
  },
  "notes": "Booking created from checkout",
  "paymentData": {
    "razorpayOrderId": "order_xxxxxxxxxxxxx",
    "razorpayPaymentId": "pay_xxxxxxxxxxxxx",
    "razorpaySignature": "signature_xxxxxxxxxxxxx"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully with payment verification",
  "data": {
    "booking": {...},
    "bookingReference": "FIXD93ECC2B",
    "paymentDetails": {
      "paymentId": "pay_xxxxxxxxxxxxx",
      "orderId": "order_xxxxxxxxxxxxx",
      "amount": 35300,
      "status": "captured"
    }
  }
}
```

---

### 3. Get Booking by ID

Get booking details by booking ID or booking reference.

**Endpoint:** `GET /api/bookings/:id`

**Full URL:** `http://localhost:5000/api/bookings/:id`

**Example:** `http://localhost:5000/api/bookings/65a1b2c3d4e5f6g7h8i9j0k1` or `http://localhost:5000/api/bookings/FIXD93ECC2B`

**Authentication:** Optional (vendor auth if token provided)

**Parameters:**
- `id` (string): Booking ID (MongoDB ObjectId) or Booking Reference (e.g., FIXD93ECC2B)

**Response:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "bookingReference": "FIXD93ECC2B",
      "customer": {...},
      "services": [...],
      "status": "waiting_for_engineer",
      "vendor": {...},
      "pricing": {...},
      "createdAt": "2024-01-15T10:00:00.000Z"
    },
    "bookingReference": "FIXD93ECC2B"
  }
}
```

---

### 4. Get Bookings by Customer Email

Get all bookings for a specific customer.

**Endpoint:** `GET /api/bookings/customer/:email`

**Full URL:** `http://localhost:5000/api/bookings/customer/:email`

**Example:** `http://localhost:5000/api/bookings/customer/panchalajay717@gmail.com`

**Authentication:** Not required

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)

**Example:**
```
GET /api/bookings/customer/panchalajay717@gmail.com?page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bookings": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalBookings": 50,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### 5. Update Booking Status

Update the status of a booking.

**Endpoint:** `PATCH /api/bookings/:id/status`

**Full URL:** `http://localhost:5000/api/bookings/:id/status`

**Example:** `http://localhost:5000/api/bookings/65a1b2c3d4e5f6g7h8i9j0k1/status`

**Authentication:** Not required

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Allowed Status Values:**
- `pending`
- `waiting_for_engineer`
- `confirmed`
- `in_progress`
- `completed`
- `cancelled`

**Response:**
```json
{
  "success": true,
  "message": "Booking status updated successfully",
  "data": {
    "booking": {...},
    "bookingReference": "FIXD93ECC2B"
  }
}
```

---

### 6. Get Booking Statistics

Get overall booking statistics.

**Endpoint:** `GET /api/bookings/stats`

**Full URL:** `http://localhost:5000/api/bookings/stats`

**Authentication:** Not required

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBookings": 1000,
    "pendingBookings": 50,
    "confirmedBookings": 200,
    "inProgressBookings": 150,
    "completedBookings": 500,
    "cancelledBookings": 100,
    "totalRevenue": 500000
  }
}
```

---

### 7. Check First-Time User

Check if user is booking for the first time (Feature Disabled).

**Endpoint:** `POST /api/bookings/check-first-time`

**Full URL:** `http://localhost:5000/api/bookings/check-first-time`

**Authentication:** Not required

---

### 8. Test Booking Routes

Test endpoint to verify booking routes are working.

**Endpoint:** `GET /api/bookings/test`

**Full URL:** `http://localhost:5000/api/bookings/test`

**Authentication:** Not required

**Response:**
```json
{
  "success": true,
  "message": "Booking routes are working",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

---

### 9. Test Vendor Authentication

Test endpoint to verify vendor authentication is working.

**Endpoint:** `GET /api/bookings/test-auth`

**Full URL:** `http://localhost:5000/api/bookings/test-auth`

**Authentication:** Required (Vendor Token)

**Response:**
```json
{
  "success": true,
  "message": "Vendor authentication is working",
  "vendor": {
    "vendorId": "VENDOR001",
    "email": "vendor@example.com"
  },
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

**Request Body:**
```json
{
  "email": "panchalajay717@gmail.com",
  "phone": "7610416911"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "email": "panchalajay717@gmail.com",
    "phone": "7610416911",
    "isFirstTimeUser": false,
    "message": "Regular pricing applies for all users"
  }
}
```

---

## Vendor Booking Routes

### 10. Get Vendor's Bookings

Get all bookings assigned to the authenticated vendor.

**Endpoint:** `GET /api/bookings/vendor/me`

**Full URL:** `http://localhost:5000/api/bookings/vendor/me`

**Authentication:** Required (Vendor Token)

**Headers:**
```
Authorization: Bearer <vendor_token>
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `status` (string, optional): Filter by status

**Response:**
```json
{
  "success": true,
  "data": {
    "bookings": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalBookings": 50,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### 11. Get Bookings by Vendor ID

Get all bookings assigned to a specific vendor.

**Endpoint:** `GET /api/bookings/vendor/:vendorId`

**Full URL:** `http://localhost:5000/api/bookings/vendor/:vendorId`

**Example:** `http://localhost:5000/api/bookings/vendor/VENDOR001`

**Authentication:** Not required

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `status` (string, optional): Filter by status

---

### 12. Accept Task

Vendor accepts an assigned task.

**Endpoint:** `PATCH /api/bookings/:id/accept`

**Full URL:** `http://localhost:5000/api/bookings/:id/accept`

**Example:** `http://localhost:5000/api/bookings/65a1b2c3d4e5f6g7h8i9j0k1/accept`

**Authentication:** Required (Vendor Token)

**Request Body:**
```json
{
  "vendorResponse": {
    "status": "accepted"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Task accepted successfully",
  "data": {
    "booking": {...},
    "status": "in_progress"
  }
}
```

**Note:** Status automatically changes to `in_progress` when accepted.

---

### 13. Decline Task

Vendor declines an assigned task (₹100 penalty applied).

**Endpoint:** `PATCH /api/bookings/:id/decline`

**Full URL:** `http://localhost:5000/api/bookings/:id/decline`

**Example:** `http://localhost:5000/api/bookings/65a1b2c3d4e5f6g7h8i9j0k1/decline`

**Authentication:** Required (Vendor Token)

**Request Body:**
```json
{
  "vendorResponse": {
    "responseNote": "Unable to complete due to technical issues"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Task declined successfully. ₹100 penalty has been applied to your wallet.",
  "data": {
    "booking": {...}
  },
  "penalty": {
    "applied": true,
    "amount": 100,
    "reason": "Task rejection in vendor area"
  }
}
```

**Note:** Requires minimum ₹100 wallet balance. Status remains `pending` for user visibility.

---

### 14. Complete Task

Vendor marks a task as completed.

**Endpoint:** `PATCH /api/bookings/:id/complete`

**Full URL:** `http://localhost:5000/api/bookings/:id/complete`

**Example:** `http://localhost:5000/api/bookings/65a1b2c3d4e5f6g7h8i9j0k1/complete`

**Authentication:** Required (Vendor Token)

**Request Body:**
```json
{
  "completionData": {
    "resolutionNote": "Issue resolved successfully",
    "billingAmount": "500",
    "spareParts": [
      {
        "name": "RAM",
        "amount": "2000"
      }
    ],
    "travelingAmount": "100",
    "paymentMethod": "cash",
    "completedAt": "2024-01-15T12:00:00.000Z",
    "includeGST": false,
    "gstAmount": 0
  }
}
```

**Payment Method Options:**
- `cash`: Payment collected in cash
- `online`: Payment to be made online by customer

**Response:**
```json
{
  "success": true,
  "message": "Task completed successfully",
  "data": {
    "booking": {
      "status": "completed",
      "completionData": {...},
      "billingAmount": "500"
    }
  }
}
```

**Note:** 
- For cash payment: Status changes to `completed`, wallet deduction applied
- For online payment: Status changes to `in_progress`, payment status `pending`

---

### 15. Cancel Booking (Vendor)

Vendor cancels a booking (₹100 penalty applied).

**Endpoint:** `PATCH /api/bookings/:id/cancel`

**Full URL:** `http://localhost:5000/api/bookings/:id/cancel`

**Example:** `http://localhost:5000/api/bookings/65a1b2c3d4e5f6g7h8i9j0k1/cancel`

**Authentication:** Required (Vendor Token)

**Request Body:**
```json
{
  "reason": "Customer address not accessible"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "booking": {
      "status": "cancelled",
      "cancellationData": {
        "isCancelled": true,
        "cancelledBy": "vendor",
        "cancellationReason": "Customer address not accessible",
        "cancelledAt": "2024-01-15T12:00:00.000Z"
      }
    }
  }
}
```

---

### 16. Reschedule Booking (Vendor)

Vendor reschedules a booking.

**Endpoint:** `PATCH /api/bookings/:id/reschedule`

**Full URL:** `http://localhost:5000/api/bookings/:id/reschedule`

**Example:** `http://localhost:5000/api/bookings/65a1b2c3d4e5f6g7h8i9j0k1/reschedule`

**Authentication:** Required (Vendor Token)

**Request Body:**
```json
{
  "newDate": "2024-01-20",
  "newTime": "2:00 PM",
  "reason": "Technical issue at current location"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking rescheduled successfully",
  "data": {
    "booking": {...},
    "rescheduleInfo": {
      "originalDate": "2024-01-15",
      "originalTime": "10:00 AM",
      "newDate": "2024-01-20",
      "newTime": "2:00 PM",
      "reason": "Technical issue at current location"
    }
  }
}
```

---

## User Booking Routes

### 17. Cancel Booking (User)

User cancels their own booking.

**Endpoint:** `PATCH /api/bookings/:id/cancel-by-user`

**Full URL:** `http://localhost:5000/api/bookings/:id/cancel-by-user`

**Example:** `http://localhost:5000/api/bookings/65a1b2c3d4e5f6g7h8i9j0k1/cancel-by-user`

**Authentication:** Not required

**Request Body:**
```json
{
  "reason": "Changed my mind"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "booking": {
      "status": "cancelled",
      "cancellationData": {
        "isCancelled": true,
        "cancelledBy": "customer",
        "cancellationReason": "Changed my mind",
        "cancelledAt": "2024-01-15T12:00:00.000Z"
      }
    },
    "bookingReference": "FIXD93ECC2B"
  }
}
```

---

### 18. Reschedule Booking (User)

User reschedules their booking.

**Endpoint:** `PATCH /api/bookings/:id/reschedule-by-user`

**Full URL:** `http://localhost:5000/api/bookings/:id/reschedule-by-user`

**Example:** `http://localhost:5000/api/bookings/65a1b2c3d4e5f6g7h8i9j0k1/reschedule-by-user`

**Authentication:** Not required

**Request Body:**
```json
{
  "newDate": "2024-01-20",
  "newTime": "2:00 PM",
  "reason": "Not available on scheduled date"
}
```

**Validation:**
- New appointment must be at least 2 hours from current time

**Response:**
```json
{
  "success": true,
  "message": "Booking rescheduled successfully",
  "data": {
    "booking": {...},
    "rescheduleInfo": {
      "originalDate": "2024-01-15",
      "originalTime": "10:00 AM",
      "newDate": "2024-01-20",
      "newTime": "2:00 PM",
      "reason": "Not available on scheduled date"
    }
  }
}
```

---

## Payment Routes

### 19. Create Payment Order

Create Razorpay payment order for completed task (spare parts payment).

**Endpoint:** `POST /api/bookings/payment/create-order`

**Full URL:** `http://localhost:5000/api/bookings/payment/create-order`

**Authentication:** Not required

**Request Body:**
```json
{
  "bookingId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "amount": 500,
  "currency": "INR"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment order created successfully",
  "data": {
    "orderId": "order_xxxxxxxxxxxxx",
    "amount": 50000,
    "currency": "INR",
    "paymentUrl": "/payment/65a1b2c3d4e5f6g7h8i9j0k1?orderId=order_xxxxxxxxxxxxx"
  }
}
```

---

### 20. Verify Payment

Verify Razorpay payment and update booking status.

**Endpoint:** `POST /api/bookings/payment/verify`

**Full URL:** `http://localhost:5000/api/bookings/payment/verify`

**Authentication:** Not required

**Request Body:**
```json
{
  "bookingId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "razorpayOrderId": "order_xxxxxxxxxxxxx",
  "razorpayPaymentId": "pay_xxxxxxxxxxxxx",
  "razorpaySignature": "signature_xxxxxxxxxxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully and booking completed",
  "data": {
    "booking": {
      "status": "completed",
      "paymentStatus": "payment_done",
      "completedAt": "2024-01-15T12:00:00.000Z"
    }
  }
}
```

---

### 21. Test Razorpay Configuration

Check if Razorpay is properly configured.

**Endpoint:** `GET /api/bookings/payment/test-config`

**Full URL:** `http://localhost:5000/api/bookings/payment/test-config`

**Authentication:** Not required

**Response:**
```json
{
  "success": true,
  "razorpayConfigured": true,
  "hasKeyId": true,
  "hasKeySecret": true,
  "keyIdLength": 20
}
```

---

## Admin Booking Routes

All admin routes require admin authentication.

**Base URL:** `/api/admin/bookings`

**Authentication:** Required (Admin Token)

**Headers:**
```
Authorization: Bearer <admin_token>
```

---

### 22. Get All Bookings (Admin)

Get all bookings with filters and pagination.

**Endpoint:** `GET /api/admin/bookings`

**Full URL:** `http://localhost:5000/api/admin/bookings`

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `status` (string, optional): Filter by status
- `paymentStatus` (string, optional): Filter by payment status
- `search` (string, optional): Search by customer name, email, or booking reference
- `sortBy` (string, optional): Sort field (default: createdAt)
- `sortOrder` (string, optional): Sort order - `asc` or `desc` (default: desc)

**Example:**
```
GET /api/admin/bookings?page=1&limit=20&status=waiting_for_engineer&search=FIXD93ECC2B
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bookings": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalBookings": 200,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### 23. Get Booking by ID (Admin)

Get single booking details.

**Endpoint:** `GET /api/admin/bookings/:id`

**Full URL:** `http://localhost:5000/api/admin/bookings/:id`

**Example:** `http://localhost:5000/api/admin/bookings/65a1b2c3d4e5f6g7h8i9j0k1`

**Response:**
```json
{
  "success": true,
  "data": {
    "booking": {...},
    "bookingReference": "FIXD93ECC2B"
  }
}
```

---

### 24. Update Booking Status (Admin)

Update booking status.

**Endpoint:** `PATCH /api/admin/bookings/:id/status`

**Full URL:** `http://localhost:5000/api/admin/bookings/:id/status`

**Example:** `http://localhost:5000/api/admin/bookings/65a1b2c3d4e5f6g7h8i9j0k1/status`

**Request Body:**
```json
{
  "status": "confirmed"
}
```

---

### 25. Update Booking Priority (Admin)

Update booking priority.

**Endpoint:** `PATCH /api/admin/bookings/:id/priority`

**Full URL:** `http://localhost:5000/api/admin/bookings/:id/priority`

**Example:** `http://localhost:5000/api/admin/bookings/65a1b2c3d4e5f6g7h8i9j0k1/priority`

**Request Body:**
```json
{
  "priority": "high"
}
```

**Priority Values:**
- `low`
- `normal`
- `high`
- `urgent`

---

### 26. Assign Vendor to Booking

Assign a vendor to a booking.

**Endpoint:** `PATCH /api/admin/bookings/:id/assign-vendor`

**Full URL:** `http://localhost:5000/api/admin/bookings/:id/assign-vendor`

**Example:** `http://localhost:5000/api/admin/bookings/65a1b2c3d4e5f6g7h8i9j0k1/assign-vendor`

**Request Body:**
```json
{
  "vendorId": "VENDOR001",
  "assignmentNotes": "Assigned to best available vendor"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vendor assigned successfully",
  "data": {
    "booking": {
      "vendor": {
        "vendorId": "VENDOR001",
        "assignedAt": "2024-01-15T12:00:00.000Z"
      }
    }
  }
}
```

---

### 27. Process Refund

Process refund for a booking.

**Endpoint:** `POST /api/admin/bookings/:id/refund`

**Full URL:** `http://localhost:5000/api/admin/bookings/:id/refund`

**Example:** `http://localhost:5000/api/admin/bookings/65a1b2c3d4e5f6g7h8i9j0k1/refund`

**Request Body:**
```json
{
  "amount": 353,
  "reason": "Service not provided",
  "refundMethod": "original"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "booking": {
      "refund": {
        "amount": 353,
        "reason": "Service not provided",
        "processedAt": "2024-01-15T12:00:00.000Z"
      }
    }
  }
}
```

---

### 28. Get Booking Statistics (Admin)

Get booking statistics for admin dashboard.

**Endpoint:** `GET /api/admin/bookings/stats`

**Full URL:** `http://localhost:5000/api/admin/bookings/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBookings": 1000,
    "pendingBookings": 50,
    "confirmedBookings": 200,
    "inProgressBookings": 150,
    "completedBookings": 500,
    "cancelledBookings": 100,
    "totalRevenue": 500000,
    "todayBookings": 25,
    "thisWeekBookings": 150,
    "thisMonthBookings": 600
  }
}
```

---

### 29. Delete Booking (Admin)

Delete a booking permanently.

**Endpoint:** `DELETE /api/admin/bookings/:id`

**Full URL:** `http://localhost:5000/api/admin/bookings/:id`

**Example:** `http://localhost:5000/api/admin/bookings/65a1b2c3d4e5f6g7h8i9j0k1`

**Response:**
```json
{
  "success": true,
  "message": "Booking deleted successfully"
}
```

---

## Response Formats

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error description"
}
```

---

## Error Handling

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (Validation error)
- `401` - Unauthorized (Authentication required)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### Common Error Messages

1. **Validation Errors:**
   ```json
   {
     "success": false,
     "message": "Customer information, services, pricing, and scheduling are required"
   }
   ```

2. **Authentication Errors:**
   ```json
   {
     "success": false,
     "message": "Authentication required"
   }
   ```

3. **Not Found Errors:**
   ```json
   {
     "success": false,
     "message": "Booking not found"
   }
   ```

4. **Wallet Balance Errors:**
   ```json
   {
     "success": false,
     "message": "Insufficient wallet balance. You need at least ₹100 to decline this task.",
     "error": "INSUFFICIENT_WALLET_BALANCE",
     "currentBalance": 50,
     "requiredAmount": 100
   }
   ```

---

## Booking Status Flow

```
pending → waiting_for_engineer → confirmed → in_progress → completed
                                                      ↓
                                                 cancelled
```

### Status Descriptions

- **pending**: Initial booking created, waiting for processing
- **waiting_for_engineer**: Booking created, waiting for vendor assignment
- **confirmed**: Vendor assigned, booking confirmed
- **in_progress**: Vendor accepted and working on task
- **completed**: Task completed successfully
- **cancelled**: Booking cancelled by user or vendor

---

## Payment Methods

### Cash on Delivery (COD)
- Payment status: `pending` at creation
- Payment collected at service completion
- Status changes to `collected` after completion

### Online Payment (Card/UPI)
- Payment status: `completed` at creation
- Razorpay payment verification required
- Payment verified before booking creation

---

## Notes

1. **Booking Reference Format:** `FIX` + last 8 characters of MongoDB ObjectId (uppercase)
   - Example: `FIXD93ECC2B`

2. **Vendor Penalties:**
   - Task decline: ₹100 penalty
   - Task cancellation: ₹100 penalty
   - Requires minimum wallet balance

3. **Mandatory Deposit:**
   - Vendors need ₹2000 mandatory deposit to accept tasks
   - Checked when vendor tries to accept a task

4. **Reschedule Validation:**
   - New appointment must be at least 2 hours from current time
   - Applies to both user and vendor reschedules

5. **First-Time User Feature:**
   - Currently disabled
   - All users pay regular pricing

---

## Support

For API support or issues, contact the development team.

**Last Updated:** January 2024
