# Quick Fix - Local Mobile Development

## Problem
Mobile webview se `https://getfixfly.com/api` access kar raha hai, lekin local development ke liye local IP chahiye.

## Immediate Solution (Testing ke liye)

### Step 1: Development Machine ka IP Address Find Karo

**PowerShell mein:**
```powershell
ipconfig | findstr IPv4
```

Ya:
```powershell
ipconfig
```
"IPv4 Address" dekho - example: `192.168.1.100`

### Step 2: Mobile WebView Console mein Manually Set Karo

Mobile app ke browser console mein (ya Flutter app se webview console access karke):

```javascript
// Your local IP address (example: 192.168.1.100)
localStorage.setItem('API_BASE_URL', 'http://192.168.1.100:5000/api');
console.log('✅ API URL set:', localStorage.getItem('API_BASE_URL'));
location.reload(); // Page reload karo
```

### Step 3: Verify

Console mein check karo:
```javascript
console.log('Current API URL:', localStorage.getItem('API_BASE_URL'));
```

## Flutter App mein Permanent Fix

Flutter app mein webview load karne se pehle:

```dart
// Get your development machine's IP (example: 192.168.1.100)
String localApiUrl = 'http://192.168.1.100:5000/api';

await webViewController.evaluateJavascript('''
  localStorage.setItem('API_BASE_URL', '$localApiUrl');
  console.log('✅ Local API URL set:', localStorage.getItem('API_BASE_URL'));
''');
```

## Important Notes

1. **Same Network**: Mobile device aur development machine same WiFi par hone chahiye
2. **Firewall**: Port 5000 allow karo Windows Firewall mein
3. **Backend Running**: Backend server `npm run dev` se chal raha hona chahiye
4. **IP Address**: Har baar WiFi connect karne par IP change ho sakta hai

## Troubleshooting

### Still getting "Failed to fetch"?
1. Check backend running: `http://localhost:5000/health` (browser mein)
2. Check IP correct hai: `ipconfig` se verify karo
3. Check same network: Mobile aur PC same WiFi par hain?
4. Check firewall: Port 5000 allow hai?

### IP Address kaise find kare?
- Windows: `ipconfig` → "IPv4 Address"
- Mac: `ifconfig` → "inet" address
- Linux: `ip addr` → "inet" address

