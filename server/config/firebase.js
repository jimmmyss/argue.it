const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length === 0) {
      let serviceAccount;
      
      // Try to parse service account from environment variable
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
          serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } catch (error) {
          console.error('Error parsing FIREBASE_SERVICE_ACCOUNT:', error);
          throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT JSON');
        }
      } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        // Use service account file path
        serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      } else {
        // Fallback to looking for any service account file (for backwards compatibility)
        const fs = require('fs');
        const path = require('path');
        try {
          const serviceAccountFiles = fs.readdirSync(__dirname + '/../')
            .filter(file => file.includes('firebase') && file.includes('adminsdk') && file.endsWith('.json'));
          
          if (serviceAccountFiles.length > 0) {
            serviceAccount = require(__dirname + '/../' + serviceAccountFiles[0]);
            console.log('🔥 Using Firebase service account from file:', serviceAccountFiles[0]);
          } else {
            throw new Error('No service account file found');
          }
        } catch (error) {
        // Demo mode - use mock credentials for development
        console.warn('⚠️  Firebase not configured - running in demo mode');
        console.warn('⚠️  Please set up Firebase credentials for full functionality');
        
        serviceAccount = {
          type: "service_account",
          project_id: "argue-it-9dc2a",
          private_key_id: "demo",
          private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC0demo\n-----END PRIVATE KEY-----\n",
          client_email: "demo@argue-it-9dc2a.iam.gserviceaccount.com",
          client_id: "demo",
          auth_uri: "https://accounts.google.com/o/oauth2/auth",
          token_uri: "https://oauth2.googleapis.com/token"
        };
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://argue-it-9dc2a-default-rtdb.firebaseio.com/'
      });

      console.log('🔥 Firebase Admin SDK initialized');
    }

    return admin;
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error);
    console.warn('⚠️  Server will start but Firebase features will not work');
    console.warn('⚠️  Please configure Firebase credentials in environment variables');
    return admin;
  }
};

// Get Firestore instance
const getFirestore = () => {
  try {
    const firebase = initializeFirebase();
    return firebase.firestore();
  } catch (error) {
    console.warn('Firestore not available in demo mode');
    return null;
  }
};

// Get Auth instance
const getAuth = () => {
  try {
    const firebase = initializeFirebase();
    return firebase.auth();
  } catch (error) {
    console.warn('Firebase Auth not available in demo mode');
    return null;
  }
};

module.exports = {
  initializeFirebase,
  getFirestore,
  getAuth,
  admin
};
