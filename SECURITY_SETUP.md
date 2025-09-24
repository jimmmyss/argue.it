# 🔐 Security Setup Guide

This project has been configured for **secure deployment** with proper environment variable management.

## 🚨 Important Security Notes

**NEVER commit these files to Git:**
- `server/argue-it-9dc2a-firebase-adminsdk-fbsvc-2ef4a9d7bc.json`
- `server/.env`
- `client/.env`
- Any files containing API keys or secrets

## ⚙️ Environment Setup

### 1. **Client Configuration (React App)**

Copy the environment template:
```bash
cp client/.env.example client/.env
```

Edit `client/.env` with your Firebase configuration:
```env
REACT_APP_FIREBASE_API_KEY=your_actual_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 2. **Server Configuration (Node.js API)**

Copy the environment template:
```bash
cp server/env.example server/.env
```

Edit `server/.env` with your server configuration:
```env
# Firebase - Use file path method
FIREBASE_SERVICE_ACCOUNT_PATH=./argue-it-9dc2a-firebase-adminsdk-fbsvc-2ef4a9d7bc.json

# Server settings
PORT=5000
NODE_ENV=production
CORS_ORIGIN=*

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_POST_MAX=5
```

### 3. **Firebase Service Account Key**

Place your Firebase service account JSON file in:
```
server/argue-it-9dc2a-firebase-adminsdk-fbsvc-2ef4a9d7bc.json
```

This file is automatically ignored by Git.

## 🚀 Deployment Options

### **Option 1: Local Hosting (ngrok/localtunnel)**
```bash
# Start server
npm start

# In another terminal, expose to internet
lt --port 5000
```

### **Option 2: Cloud Deployment**
For cloud platforms (Railway, Heroku, etc.):

1. **Upload your code** (secrets are protected by .gitignore)
2. **Set environment variables** in your platform's dashboard
3. **Upload Firebase service account** as a platform secret
4. **Deploy!**

## 🔍 Security Checklist

- ✅ Firebase service account key protected by .gitignore
- ✅ Environment variables used instead of hardcoded secrets
- ✅ Template files provided for easy setup
- ✅ Clear documentation for secure deployment
- ✅ Client and server secrets properly separated

## 🆘 If You Need to Reset Security

If you accidentally committed secrets:

1. **Remove from Git history:**
   ```bash
   git rm --cached server/argue-it-9dc2a-firebase-adminsdk-fbsvc-2ef4a9d7bc.json
   git rm --cached server/.env
   git rm --cached client/.env
   git commit -m "Remove sensitive files"
   ```

2. **Regenerate Firebase keys** in Firebase Console
3. **Update your local .env files** with new credentials

## 📧 Need Help?

This security setup ensures your Firebase project and API keys remain safe while allowing easy deployment to any platform.
