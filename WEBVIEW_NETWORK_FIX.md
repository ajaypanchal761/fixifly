# WebView Network Fix - api.razorpay.com Not Calling

## 🚨 Problem

WebView APK mein `api.razorpay.com` call hi nahi ho raha. Razorpay script load nahi ho raha ya network calls block ho rahe hain.

## ✅ Fixes Applied

### 1. **Enhanced Script Loading with Retry**
- **Issue:** Script load nahi ho raha WebView mein
- **Fix:** Retry mechanism add kiya (3 attempts)
- **Location:** `frontend/src/services/razorpayService.ts`

### 2. **Increased Timeout for WebView**
- **Issue:** 10 second timeout insufficient for WebView
- **Fix:** Timeout increase kiya 15 seconds tak
- **Location:** `frontend/src/services/razorpayService.ts`

### 3. **Cross-Origin Attribute**
- **Issue:** CORS issues WebView mein
- **Fix:** `crossOrigin = 'anonymous'` add kiya
- **Location:** `frontend/src/services/razorpayService.ts`

### 4. **Better Error Handling**
- **Issue:** Errors properly log nahi ho rahe
- **Fix:** Detailed error logging with network status
- **Location:** `frontend/src/services/razorpayService.ts`

### 5. **Razorpay Availability Check**
- **Issue:** Razorpay object check nahi ho raha before use
- **Fix:** Pre-check add kiya aur auto-reload if missing
- **Location:** `frontend/src/services/razorpayService.ts`

## 🔧 How It Works Now

### Script Loading Flow:
1. Check if Razorpay already loaded
2. If not, create script element
3. Add `crossOrigin = 'anonymous'` for CORS
4. Add script to DOM
5. Wait for `onload` event
6. Verify `window.Razorpay` available
7. If fails, retry up to 3 times
8. If still fails, show error

### Retry Mechanism:
- **Attempt 1:** Immediate
- **Attempt 2:** After 2 seconds
- **Attempt 3:** After 2 more seconds
- **Total:** 3 attempts with 2 second delays

## 📋 Flutter WebView Configuration Required

### Android (AndroidManifest.xml):
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<application>
    <!-- Allow cleartext traffic for development (remove in production) -->
    <uses-library android:name="org.apache.http.legacy" android:required="false"/>
    
    <!-- WebView configuration -->
    <activity
        android:name=".MainActivity"
        android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
        android:hardwareAccelerated="true"
        android:windowSoftInputMode="adjustResize">
        
        <!-- WebView settings -->
        <meta-data
            android:name="io.flutter.embedding.android.SplashScreenDrawable"
            android:resource="@drawable/launch_background" />
    </activity>
</application>
```

### Flutter WebView Settings:
```dart
InAppWebViewSettings(
  javaScriptEnabled: true,
  domStorageEnabled: true,
  databaseEnabled: true,
  clearCache: false,
  cacheEnabled: true,
  // CRITICAL: Allow network access
  allowsInlineMediaPlayback: true,
  mediaPlaybackRequiresUserGesture: false,
  // CRITICAL: Allow third-party cookies
  thirdPartyCookiesEnabled: true,
  // CRITICAL: Allow mixed content (HTTP + HTTPS)
  mixedContentMode: MixedContentMode.MIXED_CONTENT_ALWAYS_ALLOW,
  // CRITICAL: Allow file access
  allowFileAccess: true,
  allowFileAccessFromFileURLs: true,
  allowUniversalAccessFromFileURLs: true,
)
```

## 🧪 Testing

### Test Script Loading:
1. Open app in WebView APK
2. Check console for:
   ```
   📥 Loading Razorpay script...
   📥 Script URL: https://checkout.razorpay.com/v1/checkout.js
   ✅ Razorpay script loaded successfully
   ✅ Razorpay object available
   ```

### Test Network Calls:
1. Open payment page
2. Check Network tab (if WebView debugging enabled)
3. Look for:
   - `checkout.razorpay.com/v1/checkout.js` - Script load
   - `api.razorpay.com` - API calls

### Test Retry Mechanism:
1. Disable internet temporarily
2. Try payment
3. Enable internet
4. Should retry automatically

## 🔍 Debug Commands

### Check Script Loading:
```javascript
// Frontend console
console.log('Razorpay available:', !!window.Razorpay);
console.log('Script element:', document.querySelector('script[src*="razorpay"]'));
```

### Check Network Status:
```javascript
// Frontend console
console.log('Online:', navigator.onLine);
console.log('User Agent:', navigator.userAgent);
```

### Check WebView Permissions:
```dart
// Flutter code
print('JavaScript enabled: ${settings.javaScriptEnabled}');
print('DOM storage enabled: ${settings.domStorageEnabled}');
print('Network available: ${await webViewController.checkNetworkAvailable()}');
```

## ⚠️ Common Issues & Solutions

### Issue 1: Script Not Loading
**Symptoms:**
- `❌ Failed to load Razorpay script`
- `❌ Razorpay script loading timeout`

**Solutions:**
1. Check internet connection
2. Verify WebView has INTERNET permission
3. Check if `checkout.razorpay.com` is accessible
4. Verify CORS settings

### Issue 2: Network Calls Blocked
**Symptoms:**
- Script loads but `api.razorpay.com` calls fail
- Network tab shows blocked requests

**Solutions:**
1. Enable `thirdPartyCookiesEnabled` in WebView
2. Allow mixed content
3. Check network security config
4. Verify SSL certificate

### Issue 3: CORS Errors
**Symptoms:**
- `CORS policy` errors in console
- Script loads but API calls fail

**Solutions:**
1. Add `crossOrigin = 'anonymous'` (already done)
2. Check backend CORS settings
3. Verify Razorpay domain is allowed

## 🎯 Expected Behavior

### Before Fix:
- ❌ Script load timeout
- ❌ `api.razorpay.com` calls blocked
- ❌ Payment fails immediately

### After Fix:
- ✅ Script loads with retry mechanism
- ✅ Network calls properly made
- ✅ Payment flow works
- ✅ Better error messages

## 🚀 Next Steps

1. **Verify Flutter WebView Config:** Ensure network permissions set
2. **Test Script Loading:** Check console logs
3. **Test Network Calls:** Verify API calls happening
4. **Test Payment Flow:** Complete payment test

## 💡 Pro Tips

1. **Enable WebView Debugging:** Chrome DevTools se connect karo
2. **Check Network Tab:** See actual network requests
3. **Monitor Console:** All logs dekho
4. **Test Offline/Online:** Network state changes test karo

## 📝 Flutter WebView Checklist

- [ ] INTERNET permission in AndroidManifest.xml
- [ ] `javaScriptEnabled: true` in WebView settings
- [ ] `domStorageEnabled: true` in WebView settings
- [ ] `thirdPartyCookiesEnabled: true` in WebView settings
- [ ] `mixedContentMode: MIXED_CONTENT_ALWAYS_ALLOW` (for development)
- [ ] Network security config allows Razorpay domains
- [ ] WebView debugging enabled for testing

