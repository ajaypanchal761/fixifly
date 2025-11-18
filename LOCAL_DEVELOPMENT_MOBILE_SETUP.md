# Local Development - Mobile WebView Setup

## Problem
Mobile webview se `localhost:5000` access nahi hota kyunki mobile device ka localhost device ko point karta hai, development machine ko nahi.

## Solution: Development Machine ka IP Address Use Karo

### Step 1: Development Machine ka IP Address Find Karo

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" - example: `192.168.1.100`

**Mac/Linux:**
```bash
ifconfig
# or
ip addr
```
Look for inet address - example: `192.168.1.100`

### Step 2: Backend Server Start Karo

```bash
cd backend
npm run dev
```

Server `http://localhost:5000` par chalega, lekin mobile se access karne ke liye `http://192.168.1.100:5000` use karna hoga.

### Step 3: Flutter App mein Local IP Set Karo

Flutter app mein webview load karne se pehle:

```dart
// Get your development machine's IP (example: 192.168.1.100)
String localApiUrl = 'http://192.168.1.100:5000/api';

await webViewController.evaluateJavascript('''
  localStorage.setItem('API_BASE_URL', '$localApiUrl');
  console.log('✅ Local API URL set:', localStorage.getItem('API_BASE_URL'));
''');
```

### Step 4: Firewall Check Karo

Windows Firewall mein port 5000 allow karo:
1. Windows Security > Firewall > Advanced settings
2. Inbound Rules > New Rule
3. Port > TCP > 5000 > Allow connection

### Step 5: Same Network Check Karo

- Mobile device aur development machine same WiFi network par hone chahiye
- Different networks par kaam nahi karega

## Quick Test

Browser console mein check karo:
```javascript
// Check current API URL
console.log('API URL:', localStorage.getItem('API_BASE_URL'));

// Manually set karo (testing ke liye)
localStorage.setItem('API_BASE_URL', 'http://192.168.1.100:5000/api');
location.reload();
```

## Example Flutter Code

```dart
class WebViewManager {
  static const String LOCAL_API_URL = 'http://192.168.1.100:5000/api'; // Update with your IP
  static const String PRODUCTION_API_URL = 'https://getfixfly.com/api';
  
  static Future<void> setupWebView(WebViewController controller) async {
    // Determine which API URL to use
    String apiUrl = kDebugMode ? LOCAL_API_URL : PRODUCTION_API_URL;
    
    // Set API URL in webview
    await controller.evaluateJavascript('''
      localStorage.setItem('API_BASE_URL', '$apiUrl');
      console.log('✅ API URL configured:', '$apiUrl');
    ''');
  }
}

// Usage
final webViewController = WebViewController();
await WebViewManager.setupWebView(webViewController);
await webViewController.loadRequest(Uri.parse('YOUR_URL'));
```

## Troubleshooting

### Issue: Still getting "Failed to fetch"
1. Check backend server running hai: `http://localhost:5000/health`
2. Check IP address correct hai
3. Check mobile aur PC same network par hain
4. Check firewall port 5000 allow hai
5. Browser console mein API URL verify karo

### Issue: CORS Error
Backend CORS already configured hai, lekin agar issue aaye to:
- Backend server restart karo
- Check `backend/server.js` mein CORS configuration

## Production vs Development

- **Development**: `http://192.168.1.100:5000/api` (local IP)
- **Production**: `https://getfixfly.com/api` (production URL)

Flutter app mein environment-based URL use karo.

