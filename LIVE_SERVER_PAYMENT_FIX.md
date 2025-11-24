# Live Server Payment Fix - Complete Guide

## 🎯 Issue
Payment fail ho raha hai live server pe (production environment).

## 🔍 Root Causes

### 1. **VITE_API_URL Not Set in Production**
- Vercel environment variables mein `VITE_API_URL` set nahi hai
- Ya relative path `/api` use ho raha hai jo production mein work nahi karta

### 2. **Callback URL Not Publicly Accessible**
- Callback URL localhost ya relative path pe point kar raha hai
- Razorpay servers se publicly accessible URL chahiye

### 3. **Production Backend URL Not Detected**
- Code production environment detect nahi kar raha
- Production backend URL use nahi ho raha

---

## ✅ Fixes Applied

### 1. **Production Environment Detection Enhanced**
```typescript
const isProduction = import.meta.env.PROD || 
                    window.location.hostname.includes('getfixfly.com') ||
                    window.location.hostname.includes('vercel.app') ||
                    window.location.protocol === 'https:';
```

### 2. **Automatic Production Backend URL Fallback**
- Agar `VITE_API_URL` relative/localhost hai aur production environment hai
- To automatically `https://api.getfixfly.com` use hoga

### 3. **Callback URL Validation**
- Callback URL publicly accessible hai ya nahi check hota hai
- HTTPS aur public hostname verify hota hai

---

## 🚀 Steps to Fix on Live Server

### Step 1: Vercel Environment Variables Check Karein

1. Vercel Dashboard mein jao: https://vercel.com/dashboard
2. Project select karein
3. Settings → Environment Variables
4. Check karein ki yeh variables set hain:

```
VITE_API_URL=https://api.getfixfly.com/api
VITE_RAZORPAY_KEY_ID=rzp_test_8sYbzHWidwe5Zw
```

**Important:** 
- `VITE_API_URL` MUST be absolute URL (NOT relative `/api`)
- MUST be HTTPS (NOT HTTP)
- MUST be publicly accessible

### Step 2: Frontend Rebuild Karein

```bash
cd frontend
npm run build
vercel --prod
```

### Step 3: Backend Verify Karein

```bash
# SSH into Contabo VPS
ssh root@your-contabo-server

# Test callback endpoint
curl https://api.getfixfly.com/api/payment/test-callback

# Expected response:
# {"success":true,"message":"Payment callback route is accessible"}
```

### Step 4: Browser Console Logs Check Karein

Payment attempt ke time console mein yeh logs dikhne chahiye:

```
🌐 ========== PRODUCTION/LIVE SERVER DETECTION ==========
🌐 Is Production: true
🌐 Current Hostname: www.getfixfly.com
🌐 VITE_API_URL: https://api.getfixfly.com/api
🌐 ===============================================

🔗 ========== CALLBACK URL CONFIGURATION (LIVE SERVER) ==========
🔗 Is Production: true
🔗 API Base (Final): https://api.getfixfly.com
🔗 Callback URL: https://api.getfixfly.com/api/payment/razorpay-callback
🔗 Expected Callback URL: https://api.getfixfly.com/api/payment/razorpay-callback
🔗 Callback URL Match: ✅ MATCH
🔗 Callback URL is Public: ✅ YES
🔗 Callback URL Protocol: https:
🔗 Callback URL Hostname: api.getfixfly.com
🔗 ===============================================
```

---

## 🐛 Troubleshooting

### Issue 1: Callback URL Still Localhost

**Symptoms:**
```
🔗 Callback URL: http://localhost:5000/api/payment/razorpay-callback
🔗 Callback URL Match: ❌ MISMATCH
```

**Solution:**
1. Vercel mein `VITE_API_URL` check karein
2. Frontend rebuild karein
3. Browser cache clear karein

### Issue 2: VITE_API_URL Not Set

**Symptoms:**
```
⚠️ VITE_API_URL not set! Using relative path "/api".
⚠️ This may cause payment failures in production.
```

**Solution:**
1. Vercel Dashboard → Settings → Environment Variables
2. Add: `VITE_API_URL=https://api.getfixfly.com/api`
3. Redeploy frontend

### Issue 3: Callback URL Not Publicly Accessible

**Symptoms:**
```
❌ ❌ ❌ CRITICAL ERROR: Callback URL is not publicly accessible! ❌ ❌ ❌
```

**Solution:**
1. Verify backend server publicly accessible hai:
   ```bash
   curl https://api.getfixfly.com/api/payment/test-callback
   ```
2. Check firewall/security groups
3. Verify domain DNS settings

---

## 📋 Verification Checklist

- [ ] `VITE_API_URL` Vercel mein set hai: `https://api.getfixfly.com/api`
- [ ] Frontend rebuild ho chuka hai
- [ ] Backend callback endpoint accessible hai
- [ ] Browser console logs mein production detection dikh raha hai
- [ ] Callback URL match ho raha hai: `https://api.getfixfly.com/api/payment/razorpay-callback`
- [ ] Callback URL publicly accessible hai (HTTPS, public hostname)
- [ ] Payment attempt ke time backend logs mein callback route hit ho raha hai

---

## 🔧 Manual Fix (If Automatic Fix Doesn't Work)

### Option 1: Hardcode Production URL (Temporary)

```typescript
// In razorpayService.ts constructor
this.apiUrl = import.meta.env.VITE_API_URL || 
               (import.meta.env.PROD ? 'https://api.getfixfly.com/api' : '/api');
```

### Option 2: Environment-Specific Configuration

Create `.env.production` file:
```
VITE_API_URL=https://api.getfixfly.com/api
```

---

## 📞 Support

Agar abhi bhi issue ho, to yeh information share karein:

1. **Browser Console Logs** (payment attempt ke time)
2. **Vercel Environment Variables** (screenshot)
3. **Backend Logs** (last 50 lines)
4. **Callback URL** (console logs se)

---

## ✅ Expected Behavior After Fix

1. **Production Detection:** ✅ Properly detect hota hai
2. **API URL:** ✅ Production backend URL use hota hai
3. **Callback URL:** ✅ Publicly accessible URL set hota hai
4. **Payment Flow:** ✅ Successfully complete hota hai
5. **Backend Logs:** ✅ Callback route hit hota hai

---

## 🎯 Quick Fix Command

```bash
# 1. Vercel mein environment variable set karein
# VITE_API_URL=https://api.getfixfly.com/api

# 2. Frontend rebuild
cd frontend && npm run build && vercel --prod

# 3. Test
# Browser console mein logs check karein
# Payment attempt karein
# Backend logs check karein
```

