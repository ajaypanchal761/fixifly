# VAPID Key Setup Guide for Firebase Push Notifications

## Error: Invalid VAPID Key

If you're seeing the error:
```
❌ Error getting FCM token: InvalidAccessError: Failed to execute 'subscribe' on 'PushManager': The provided applicationServerKey is not valid.
```

This means the VAPID key is missing, incorrect, or incomplete.

## How to Get the Correct VAPID Key

### Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com)
2. Select your project: **fixfly-fb12b**

### Step 2: Navigate to Cloud Messaging Settings
1. Click on the **gear icon** (⚙️) next to "Project Overview"
2. Select **"Project settings"**
3. Click on the **"Cloud Messaging"** tab

### Step 3: Generate or Copy VAPID Key
1. Scroll down to **"Web Push certificates"** section
2. If you see a key pair already generated:
   - Copy the **Key pair** value (it's a long string, typically 87 characters)
3. If no key pair exists:
   - Click **"Generate key pair"** button
   - Copy the generated key pair

### Step 4: Update VAPID Key in Your Project

**Option 1: Environment Variable (Recommended)**
1. Create or update `.env` file in `frontend/` directory:
   ```env
   VITE_FIREBASE_VAPID_KEY=your_vapid_key_here
   ```
2. Restart your development server

**Option 2: Direct Update in Code**
1. Open `frontend/src/firebase.ts`
2. Update the `VAPID_KEY` constant:
   ```typescript
   const VAPID_KEY = "your_vapid_key_here";
   ```

## VAPID Key Format

A valid VAPID key:
- Is typically **87 characters long** (base64url encoded)
- Contains letters, numbers, hyphens, and underscores
- Example format: `BAXnzclIUpol3ExXQV8JokW7plpWqSJhLIFrXlnNHueIylJFuC3TQ17wWRIspB4IOmi-NffJuWq2mz9C6sC1YlQ`

## Current Issue

The current VAPID key in the code appears to be incomplete:
```
oDTaeXnVvSpGK_5yngDj1XlUgnMgnh9-tdjt20QtOpo
```

This key is only 43 characters, which is too short. Please get the full key from Firebase Console.

## Verification

After updating the VAPID key:
1. Restart your development server
2. Clear browser cache
3. Check browser console for: `✅ FCM Token generated: ...`
4. If you still see errors, verify the key is correct in Firebase Console

## Notes

- The VAPID key is **public** and safe to include in frontend code
- Each Firebase project has its own VAPID key
- The key is used to identify your app for web push notifications
- Without a valid VAPID key, web push notifications will not work

