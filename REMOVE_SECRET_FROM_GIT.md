# Remove Firebase Secret from Git History

## Problem
Firebase service account file commit history mein hai, isliye GitHub push block kar raha hai.

## Solution

### Option 1: Use git filter-branch (Recommended)

```bash
# Remove file from entire git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/config/fixfly-fb12b-firebase-adminsdk-fbsvc-d96cf044fa.json" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (WARNING: This rewrites history)
git push origin --force --all
```

### Option 2: Use BFG Repo-Cleaner (Easier)

1. Download BFG: https://rtyley.github.io/bfg-repo-cleaner/
2. Run:
```bash
java -jar bfg.jar --delete-files fixfly-fb12b-firebase-adminsdk-fbsvc-d96cf044fa.json
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all
```

### Option 3: Allow Secret in GitHub (Quick Fix)

1. Go to: https://github.com/ajaypanchal761/fixifly/security/secret-scanning/unblock-secret/35eVaDowoMqtzbzJXhsoM0uV8aC
2. Click "Allow secret" (temporary solution)
3. Then push normally

## Important Notes

⚠️ **WARNING**: Force push rewrites git history. Make sure:
- Team members know about this
- Everyone pulls latest changes after force push
- Backup your repo before force push

## After Fixing

1. File ab `.gitignore` mein hai - future commits mein include nahi hoga
2. Local file safe hai - sirf git se remove hui hai
3. Production server par manually file add karni hogi

## For Production Deployment

Service account file ko manually server par add karo:
- Path: `backend/config/fixfly-fb12b-firebase-adminsdk-fbsvc-d96cf044fa.json`
- Ya environment variable use karo: `FIREBASE_CONFIG`

