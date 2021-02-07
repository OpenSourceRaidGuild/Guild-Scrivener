import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(String(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
  ),
  databaseURL: process.env.FIREBASE_URL,
});

export const db = admin.firestore();

export const collections = {
  raidStats: 'raid-stats',
  labels: 'labels',
};
