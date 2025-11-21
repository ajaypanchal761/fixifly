# Environment Configuration Fixes for Live WebView APK Payment

## 🚨 Critical Issues Found in Your Configuration

### Issue 1: NODE_ENV is Development
**Current:** `NODE_ENV=development`  
**Should be:** `NODE_ENV=production` for live server

### Issue 2: Missing FRONTEND_URL
**Problem:** Backend doesn't know where to redirect after payment  
**Fix:** Add `FRONTEND_URL=https://getfixfly.com`

### Issue 3: CORS_ORIGIN is Localhost
**Current:** `CORS_ORIGIN=http://localhost:3000`  
**Should be:** `CORS_ORIGIN=https://getfixfly.com` (or include both)

### Issue 4: Frontend VITE_API_URL Not Set
**Problem:** Frontend doesn't know backend URL in production  
**Fix:** Set `VITE_API_URL` to your production backend URL

## ✅ Fixed Configuration

I've updated `backend/config/production.env` with:
- ✅ `NODE_ENV=production`
- ✅ `FRONTEND_URL=https://getfixfly.com`
- ✅ `CORS_ORIGIN=https://getfixfly.com`

## 📋 Action Items for You

### 1. Update Backend Environment File

Edit `backend/config/production.env` and ensure:

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Frontend URL (CRITICAL for payment callbacks)
FRONTEND_URL=https://getfixfly.com

# CORS Configuration
CORS_ORIGIN=https://getfixfly.com
```

**Important:** Replace `https://getfixfly.com` with your actual production frontend URL if different.

### 2. Set Frontend Environment Variable

**Option A: Create `.env.production` file in `frontend/` directory:**

```env
VITE_API_URL=https://your-backend-domain.com/api
```

**Option B: Set during build:**
```bash
VITE_API_URL=https://your-backend-domain.com/api npm run build
```

**Replace `https://your-backend-domain.com/api` with your actual backend URL:**
- Example: `https://api.getfixfly.com/api`
- Example: `https://backend.getfixfly.com/api`
- Example: `https://fixfly-backend.herokuapp.com/api`
- Example: `https://fixfly-backend.onrender.com/api`

### 3. Restart Backend Server

After updating environment variables:
```bash
# If using PM2
pm2 restart backend

# Or if running directly
# Stop and restart your backend server
```

### 4. Rebuild Frontend

After setting `VITE_API_URL`:
```bash
cd frontend
npm run build
```

Then rebuild your WebView APK with the new build.

## 🔍 How to Find Your Backend URL

Your backend URL should be:
- The domain where your backend server is hosted
- Must be publicly accessible (not localhost)
- Must use HTTPS in production
- Should end with `/api` or we'll add it automatically

**Examples:**
- If backend is at `https://api.getfixfly.com` → Use `https://api.getfixfly.com/api`
- If backend is at `https://getfixfly.com` → Use `https://getfixfly.com/api`
- If backend is at `https://fixfly-backend.herokuapp.com` → Use `https://fixfly-backend.herokuapp.com/api`

## ✅ Verification Checklist

After making changes:

- [ ] Backend `NODE_ENV=production`
- [ ] Backend `FRONTEND_URL` is set to production frontend URL
- [ ] Backend `CORS_ORIGIN` includes production frontend URL
- [ ] Frontend `VITE_API_URL` is set to production backend URL
- [ ] Backend server restarted
- [ ] Frontend rebuilt with production environment
- [ ] WebView APK rebuilt with new frontend build

## 🧪 Test After Configuration

1. **Check Backend Logs:**
   - Start backend server
   - Check if it shows: `Environment: production`
   - Check if `FRONTEND_URL` is logged

2. **Check Frontend Console:**
   - Open WebView APK
   - Check console for: `🔗 API_BASE_URL: [your-backend-url]`
   - Verify it's NOT localhost

3. **Test Payment:**
   - Try making a payment
   - Check console for callback URL
   - Verify callback URL is HTTPS and points to your backend
   - Check backend logs for callback receipt

## 🆘 If Payment Still Fails

1. **Check Callback URL in Console:**
   - Look for: `🔗 Callback URL: [url]`
   - Verify it's HTTPS (not HTTP)
   - Verify it's not localhost
   - Verify it points to your backend

2. **Check Backend Logs:**
   - Look for: `🔔 🔔 🔔 RAZORPAY CALLBACK RECEIVED 🔔 🔔 🔔`
   - If not received, callback URL might be wrong
   - Check if backend is accessible from internet

3. **Test Backend Accessibility:**
   ```bash
   curl https://your-backend-domain.com/health
   ```
   Should return JSON response

4. **Check CORS:**
   - If you see CORS errors in console
   - Add your frontend domain to `CORS_ORIGIN`
   - Restart backend

## 📝 Quick Reference

### Backend Environment Variables:
```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://getfixfly.com
CORS_ORIGIN=https://getfixfly.com
```

### Frontend Environment Variables:
```env
VITE_API_URL=https://your-backend-domain.com/api
```

### Critical URLs:
- **Backend API:** `https://your-backend-domain.com/api`
- **Frontend:** `https://getfixfly.com`
- **Callback URL:** `https://your-backend-domain.com/api/payment/razorpay-callback`

---

**After making these changes, payment should work in live WebView APK!**

