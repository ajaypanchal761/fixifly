# Live Payment Setup Guide - Production Environment

## 🚨 Important: Live Payments Ke Liye Configuration

### Problem
Production/Live environment mein abhi bhi **test keys** use ho rahi hain, isliye payments fail ho rahe hain.

### Solution

#### Step 1: Razorpay Dashboard Se Live Keys Lein

1. **Razorpay Dashboard Login:**
   - https://dashboard.razorpay.com/ par login karein
   - Settings → API Keys section mein jayein

2. **Live Keys Generate Karein:**
   - "Generate Live Keys" button click karein
   - Live Key ID aur Key Secret copy karein
   - Format: `rzp_live_xxxxxxxxxxxxx` (test keys: `rzp_test_...`)

---

#### Step 2: Backend Environment Variables Update Karein

**File:** `fixifly/backend/config/production.env`

```env
# Razorpay Configuration - LIVE KEYS
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_live_secret_key_here
```

**Important:**
- Test keys ko replace karein live keys se
- Secret key ko safely store karein (never commit to git)

---

#### Step 3: Frontend Environment Variables Update Karein

**File:** `.env` ya `.env.production` (frontend root mein)

```env
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
VITE_API_URL=https://your-production-api-url.com/api
```

**Note:** Frontend code ab automatically environment variable use karega.

---

#### Step 4: Server Restart Karein

1. **Backend:**
   ```bash
   # Stop current server
   # Start again
   npm start
   ```

2. **Frontend:**
   ```bash
   # Rebuild frontend
   npm run build
   # Deploy new build
   ```

---

### Verification Checklist

#### ✅ Backend Check:
- [ ] `RAZORPAY_KEY_ID` starts with `rzp_live_`
- [ ] `RAZORPAY_KEY_SECRET` is correct
- [ ] Server restarted with new keys
- [ ] Backend logs show: "✅ Razorpay service initialized successfully"

#### ✅ Frontend Check:
- [ ] `VITE_RAZORPAY_KEY_ID` set hai
- [ ] Environment variable properly loaded
- [ ] Frontend rebuilt with new env vars
- [ ] Console mein live key ID dikh raha hai

#### ✅ Payment Test:
- [ ] Real card se payment attempt
- [ ] Payment successful ho raha hai
- [ ] No "Payment could not be completed" error

---

### Common Issues

#### Issue 1: "Payment could not be completed"
**Reason:** Test keys use ho rahi hain live payments ke liye

**Solution:**
- Live keys configure karein
- Environment variables properly set karein
- Server restart karein

---

#### Issue 2: "Invalid Key ID"
**Reason:** Wrong key format ya key not activated

**Solution:**
- Razorpay dashboard mein key verify karein
- Key format check karein: `rzp_live_...`
- Account live mode mein activate hai ya nahi check karein

---

#### Issue 3: Environment Variable Not Loading
**Reason:** Frontend build mein env vars include nahi hui

**Solution:**
- `.env` file root mein hai ya nahi check karein
- `VITE_` prefix use karein (Vite requirement)
- Frontend rebuild karein: `npm run build`

---

### Test vs Live Keys

| Feature | Test Keys | Live Keys |
|---------|-----------|-----------|
| Format | `rzp_test_...` | `rzp_live_...` |
| Purpose | Testing only | Real payments |
| Cards | Test cards only | Real cards |
| Amount | Any | Real money |
| Dashboard | Test mode | Live mode |

---

### Security Best Practices

1. **Never Commit Keys:**
   - `.env` files `.gitignore` mein honi chahiye
   - Keys directly code mein hardcode na karein

2. **Use Environment Variables:**
   - Backend: `process.env.RAZORPAY_KEY_ID`
   - Frontend: `import.meta.env.VITE_RAZORPAY_KEY_ID`

3. **Separate Test & Live:**
   - Development: Test keys
   - Production: Live keys
   - Different environment files use karein

---

### Quick Fix Commands

#### Check Current Keys:
```bash
# Backend
echo $RAZORPAY_KEY_ID

# Frontend (after build)
# Check browser console: console.log(import.meta.env.VITE_RAZORPAY_KEY_ID)
```

#### Update Keys:
```bash
# Backend .env file edit karein
# Frontend .env file edit karein
# Restart servers
```

---

### After Setup

1. **Test Payment:**
   - Small amount se test karein (₹1-10)
   - Real card use karein
   - Payment successful verify karein

2. **Monitor:**
   - Razorpay dashboard mein payments check karein
   - Backend logs check karein
   - Error logs monitor karein

3. **Go Live:**
   - Sab kuch test ho jane ke baad
   - Real customers ko allow karein

---

## ⚠️ Important Notes

1. **Test Keys Production Mein Use Mat Karein:**
   - Test keys se real payments nahi hote
   - Always use live keys for production

2. **Key Security:**
   - Keys ko safely store karein
   - Never share keys publicly
   - Rotate keys periodically

3. **Environment Separation:**
   - Development: Test keys
   - Staging: Test keys (optional)
   - Production: Live keys (mandatory)

---

## 📞 Support

Agar setup ke baad bhi issue aaye:
1. Razorpay dashboard check karein
2. Backend logs check karein
3. Frontend console logs check karein
4. Environment variables verify karein

---

## ✅ Success Criteria

Live payments sahi chal rahe hain agar:
- ✅ Live keys configured hain
- ✅ Environment variables properly set hain
- ✅ Real card se payment successful ho raha hai
- ✅ No "Payment could not be completed" error
- ✅ Payment verified ho raha hai backend mein

