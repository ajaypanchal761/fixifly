# Firebase Cloud Messaging API Setup Guide

## Error: "Request is missing required authentication credential"

This error occurs when the Firebase Cloud Messaging API is not enabled or the API key doesn't have proper permissions.

## Solution Steps

### Step 1: Enable Firebase Cloud Messaging API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **fixfly-fb12b**
3. Navigate to **APIs & Services** > **Library**
4. Search for **"Firebase Cloud Messaging API"** or **"FCM API"**
5. Click on **"Firebase Cloud Messaging API"**
6. Click **"Enable"** button
7. Wait for the API to be enabled (may take a few seconds)

### Step 2: Check API Key Restrictions

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **fixfly-fb12b**
3. Navigate to **APIs & Services** > **Credentials**
4. Find your API key: `AIzaSyCwf8OGEhQJUDi2Iqtvo0GdWNrjQ_3wBNI`
5. Click on the API key to edit it
6. Under **API restrictions**, ensure:
   - Either **"Don't restrict key"** is selected (for development)
   - OR **"Restrict key"** is selected and **"Firebase Cloud Messaging API"** is included in the list
7. Under **Application restrictions**, for development you can select **"None"**
8. Click **"Save"**

### Step 3: Verify Firebase Project Settings

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **fixfly-fb12b**
3. Click on **Project Settings** (gear icon)
4. Go to **Cloud Messaging** tab
5. Ensure **"Cloud Messaging API (Legacy)"** is enabled
6. Check that **Web Push certificates** section shows your VAPID key

### Step 4: Check Billing (if applicable)

- Firebase Cloud Messaging has a generous free tier
- However, if your project has billing disabled, some APIs might not work
- Go to [Firebase Console](https://console.firebase.google.com/) > **Project Settings** > **Usage and billing**
- Ensure billing is set up (even if you're on free tier)

### Step 5: Verify Service Account Permissions

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **fixfly-fb12b**
3. Navigate to **IAM & Admin** > **Service Accounts**
4. Find: `firebase-adminsdk-fbsvc@fixfly-fb12b.iam.gserviceaccount.com`
5. Ensure it has **"Firebase Cloud Messaging Admin"** or **"Editor"** role

## Quick Checklist

- [ ] Firebase Cloud Messaging API is enabled
- [ ] API key has proper permissions (not restricted or FCM API included)
- [ ] VAPID key is correctly configured in Firebase Console
- [ ] Service account has proper permissions
- [ ] Project billing is enabled (if required)

## After Enabling API

1. Wait 2-3 minutes for changes to propagate
2. Clear browser cache
3. Restart your development server
4. Try again - the error should be resolved

## Alternative: Use Firebase SDK without explicit API key restrictions

If you're still having issues, you can temporarily:
1. Remove API key restrictions in Google Cloud Console
2. Test if it works
3. Then add restrictions back with proper configuration

## Still Having Issues?

If the error persists after following these steps:
1. Check browser console for detailed error messages
2. Verify you're using the correct Firebase project
3. Ensure the API key matches the one in Firebase Console
4. Try creating a new API key with proper permissions

