# Mobile WebView API URL Setup

## Problem
Mobile webview se `localhost:5000` access nahi hota. Mobile device ka localhost device ko point karta hai, development machine ko nahi.

## Solution

### Option 1: Flutter App se Custom API URL Set Karo (Recommended)

Flutter app mein webview load karne se pehle yeh code add karo:

```dart
// Before loading webview, set API URL
await webViewController.evaluateJavascript('''
  localStorage.setItem('API_BASE_URL', 'https://getfixfly.com/api');
  console.log('API URL set to:', localStorage.getItem('API_BASE_URL'));
''');
```

### Option 2: Production API URL Use Karo

Agar backend production par deploy hai, to automatically `https://getfixfly.com/api` use hoga.

### Option 3: Development ke liye Local IP Use Karo

1. Development machine ka local IP find karo:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr`
   - Example: `192.168.1.100`

2. Flutter app mein set karo:
```dart
await webViewController.evaluateJavascript('''
  localStorage.setItem('API_BASE_URL', 'http://192.168.1.100:5000/api');
''');
```

3. Backend server ko allow karo:
   - Firewall mein port 5000 allow karo
   - Backend server start karo: `npm run dev`

## Current Behavior

- **Desktop browser**: `http://localhost:5000/api` use hota hai
- **Mobile webview**: Automatically `https://getfixfly.com/api` use hota hai
- **Custom URL**: Flutter app se `localStorage.setItem('API_BASE_URL', 'YOUR_URL')` set kar sakte ho

## Verify API URL

Browser console mein check karo:
```javascript
console.log('API URL:', localStorage.getItem('API_BASE_URL'));
```

## Important Notes

- Production API URL: `https://getfixfly.com/api` (verify karo ki backend yahan deploy hai)
- Development: Local IP use karo (192.168.x.x:5000)
- CORS: Backend mein mobile requests allow hone chahiye (already configured)

