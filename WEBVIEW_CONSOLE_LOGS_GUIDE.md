# WebView APK Console Logs Kaise Dekhein - Complete Guide

## 🎯 Overview
Yeh guide aapko batayega ki WebView APK (Flutter) mein console logs kaise dekh sakte hain.

---

## 📱 Method 1: Flutter WebView Debug Mode (Recommended)

### Step 1: Flutter App Mein WebView Debug Enable Karein

Flutter app ke `main.dart` ya WebView configuration file mein yeh add karein:

```dart
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

// WebView settings mein debug mode enable karein
InAppWebViewSettings(
  // ... other settings
  javaScriptEnabled: true,
  debuggingEnabled: true, // CRITICAL: Ye enable karein
  // ... other settings
)
```

### Step 2: Android Studio / VS Code Mein Logcat Use Karein

1. **Android Studio:**
   - Android Studio open karein
   - Device connect karein (USB ya emulator)
   - Bottom panel mein "Logcat" tab open karein
   - Filter mein "console" ya "chromium" search karein

2. **VS Code:**
   - Flutter extension install karein
   - Terminal mein run karein:
   ```bash
   flutter run
   ```
   - Ya "Run and Debug" panel use karein

### Step 3: Logcat Commands (Terminal)

```bash
# All logs
adb logcat

# Only console logs
adb logcat | grep -i "console"

# Only JavaScript logs
adb logcat | grep -i "chromium"

# Only WebView logs
adb logcat | grep -i "webview"

# Specific app logs
adb logcat | grep -i "com.yourapp.package"
```

---

## 🌐 Method 2: Chrome DevTools (Remote Debugging)

### Step 1: Flutter WebView Mein Remote Debugging Enable Karein

```dart
InAppWebViewSettings(
  javaScriptEnabled: true,
  debuggingEnabled: true, // CRITICAL
  // ... other settings
)
```

### Step 2: Chrome Browser Mein DevTools Open Karein

1. Chrome browser open karein
2. Address bar mein type karein: `chrome://inspect`
3. "Devices" section mein aapka device dikhega
4. "inspect" button click karein
5. Console tab mein JavaScript logs dikhenge

**Note:** Device aur computer same network pe hone chahiye.

---

## 📲 Method 3: Flutter WebView Console Messages

### Step 1: Flutter App Mein Console Message Handler Add Karein

```dart
InAppWebView(
  initialUrlRequest: URLRequest(url: WebUri("https://www.getfixfly.com")),
  onConsoleMessage: (controller, consoleMessage) {
    print("Console Log: ${consoleMessage.message}");
    print("Source: ${consoleMessage.sourceId}:${consoleMessage.lineNumber}");
    print("Level: ${consoleMessage.messageLevel}");
  },
  // ... other settings
)
```

### Step 2: Logs Flutter Console Mein Dikhenge

Flutter app run karte time yeh logs terminal mein dikhenge:
```bash
flutter run
```

---

## 🔧 Method 4: ADB Commands (Direct)

### Step 1: ADB Install Karein

```bash
# Windows
# Android SDK platform-tools install karein

# Mac/Linux
brew install android-platform-tools
```

### Step 2: Device Connect Karein

```bash
# Devices check karein
adb devices

# Device connect ho gaya to proceed karein
```

### Step 3: Console Logs Filter Karein

```bash
# All console logs
adb logcat | grep -i "console"

# JavaScript errors
adb logcat | grep -i "javascript"

# WebView specific
adb logcat | grep -i "webview"

# Chromium logs (Razorpay uses Chromium)
adb logcat | grep -i "chromium"

# Specific package
adb logcat | grep -i "com.getfixfly.app"
```

---

## 🎯 Method 5: Flutter WebView Console Interceptor

### Step 1: Flutter App Mein Console Interceptor Add Karein

```dart
InAppWebView(
  initialUrlRequest: URLRequest(url: WebUri("https://www.getfixfly.com")),
  onConsoleMessage: (controller, consoleMessage) {
    // Log level ke basis pe filter karein
    if (consoleMessage.messageLevel == ConsoleMessageLevel.ERROR) {
      print("❌ ERROR: ${consoleMessage.message}");
    } else if (consoleMessage.messageLevel == ConsoleMessageLevel.WARNING) {
      print("⚠️ WARNING: ${consoleMessage.message}");
    } else if (consoleMessage.messageLevel == ConsoleMessageLevel.LOG) {
      print("ℹ️ LOG: ${consoleMessage.message}");
    } else {
      print("📝 INFO: ${consoleMessage.message}");
    }
    
    // File mein save karein (optional)
    // saveToFile(consoleMessage.message);
  },
  // ... other settings
)
```

### Step 2: Logs File Mein Save Karein (Optional)

```dart
import 'dart:io';

void saveToFile(String message) async {
  final file = File('/storage/emulated/0/Download/webview_logs.txt');
  await file.writeAsString(
    '${DateTime.now()}: $message\n',
    mode: FileMode.append,
  );
}
```

---

## 🔍 Method 6: Razorpay Specific Logs

### Step 1: Payment Flow Ke Time Specific Logs Filter Karein

```bash
# Razorpay related logs
adb logcat | grep -i "razorpay"

# Payment related logs
adb logcat | grep -i "payment"

# Callback related logs
adb logcat | grep -i "callback"

# Order related logs
adb logcat | grep -i "order"
```

### Step 2: Real-time Monitoring

```bash
# Real-time logs with timestamps
adb logcat -v time | grep -i "console\|razorpay\|payment"
```

---

## 📋 Quick Reference Commands

### Most Useful Commands:

```bash
# 1. All console logs (real-time)
adb logcat | grep -i "console"

# 2. JavaScript errors only
adb logcat | grep -i "javascript.*error"

# 3. WebView logs
adb logcat | grep -i "webview"

# 4. Chromium logs (Razorpay)
adb logcat | grep -i "chromium"

# 5. Specific app package
adb logcat | grep -i "com.getfixfly.app"

# 6. All logs with timestamps
adb logcat -v time

# 7. Clear logs and start fresh
adb logcat -c && adb logcat
```

---

## 🛠️ Method 7: Flutter DevTools (Recommended for Development)

### Step 1: Flutter DevTools Open Karein

```bash
# App run karte time DevTools automatically open hota hai
flutter run

# Ya manually open karein
flutter pub global activate devtools
flutter pub global run devtools
```

### Step 2: Console Tab Mein Logs Dekhein

1. Flutter DevTools open karein
2. "Logging" tab select karein
3. Console messages dikhenge

---

## 🎯 Method 8: Custom Logging Service

### Step 1: Flutter App Mein Custom Logger Add Karein

```dart
class WebViewLogger {
  static void log(String message, {String level = 'INFO'}) {
    print('[$level] $message');
    // Optional: Send to backend
    // sendToBackend(message, level);
  }
  
  static void error(String message) {
    log(message, level: 'ERROR');
  }
  
  static void warning(String message) {
    log(message, level: 'WARNING');
  }
  
  static void info(String message) {
    log(message, level: 'INFO');
  }
}
```

### Step 2: WebView Mein Use Karein

```dart
InAppWebView(
  onConsoleMessage: (controller, consoleMessage) {
    WebViewLogger.log(consoleMessage.message);
  },
  // ... other settings
)
```

---

## 🔥 Method 9: Real-time Log Streaming

### Step 1: Logcat Stream Setup Karein

```bash
# Real-time stream with colors
adb logcat -v color | grep --color=always -i "console\|razorpay\|payment"

# Save to file
adb logcat > webview_logs.txt

# Filter and save
adb logcat | grep -i "console\|razorpay" > payment_logs.txt
```

### Step 2: Monitor Logs

```bash
# Real-time monitoring
tail -f payment_logs.txt
```

---

## 📱 Method 10: Android Studio Logcat Filters

### Step 1: Android Studio Mein Custom Filter Create Karein

1. Android Studio open karein
2. Logcat panel open karein
3. Filter icon click karein
4. "Edit Filter Configuration" select karein
5. Filter name: "WebView Console"
6. Log Tag: `console|chromium|webview`
7. Save karein

### Step 2: Filter Apply Karein

- Dropdown se "WebView Console" filter select karein
- Sirf WebView related logs dikhenge

---

## 🎯 Best Practices

### 1. **Development Time:**
   - Flutter DevTools use karein
   - `onConsoleMessage` handler add karein
   - Real-time monitoring karein

### 2. **Production Debugging:**
   - ADB logcat use karein
   - Chrome DevTools remote debugging use karein
   - Logs file mein save karein

### 3. **Payment Flow Debugging:**
   - Specific filters use karein (razorpay, payment, callback)
   - Real-time monitoring karein
   - Backend logs ke saath compare karein

---

## 🚀 Quick Start (Recommended)

### For Immediate Console Logs:

```bash
# 1. Device connect karein
adb devices

# 2. Real-time console logs
adb logcat | grep -i "console\|chromium\|webview"

# 3. Payment specific logs
adb logcat | grep -i "razorpay\|payment\|callback"
```

### For Flutter App Development:

```dart
InAppWebView(
  onConsoleMessage: (controller, consoleMessage) {
    print("🔍 ${consoleMessage.messageLevel}: ${consoleMessage.message}");
  },
  // ... other settings
)
```

---

## 📝 Notes

- **Chrome DevTools:** Best for detailed JavaScript debugging
- **ADB Logcat:** Best for real-time monitoring
- **Flutter DevTools:** Best for Flutter app debugging
- **onConsoleMessage:** Best for app-specific logging

---

## 🆘 Troubleshooting

### Issue: Logs nahi dikh rahe
**Solution:**
1. Check karein ki `debuggingEnabled: true` set hai
2. Check karein ki `javaScriptEnabled: true` set hai
3. Device properly connect hai ya nahi

### Issue: Chrome DevTools mein device nahi dikh raha
**Solution:**
1. Device aur computer same network pe hain
2. USB debugging enabled hai
3. Chrome browser updated hai

### Issue: ADB commands kaam nahi kar rahe
**Solution:**
1. ADB properly install hai
2. Device USB debugging enabled hai
3. `adb devices` command se device detect ho raha hai

---

## ✅ Summary

**Easiest Method:**
```bash
adb logcat | grep -i "console"
```

**Best for Development:**
- Flutter DevTools + `onConsoleMessage` handler

**Best for Production Debugging:**
- ADB logcat with filters
- Chrome DevTools remote debugging

