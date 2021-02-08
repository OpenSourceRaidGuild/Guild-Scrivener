import admin from 'firebase-admin';

/* istanbul ignore else */
if (process.env.NODE_ENV !== 'production') {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
} else {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(String(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
    ),
  });
}

export const db = admin.firestore();

export const collections = {
  raidStats: 'raid-stats',
  labels: 'labels',
};
