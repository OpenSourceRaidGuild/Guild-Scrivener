import admin from 'firebase-admin';
import serviceAccount from '../serviceAccountKey.json';

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  ),
  databaseURL: process.env.FIREBASE_URL,
});

export const db = admin.firestore();
