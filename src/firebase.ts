import admin from 'firebase-admin';

const serviceAccountKey = JSON.parse(
  String(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
);
const projectId = process.env.FIREBASE_PROJECT_ID;
if (typeof projectId === 'string') {
  serviceAccountKey.project_id = projectId;
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
  databaseURL: process.env.FIREBASE_URL,
});

export const db = admin.firestore();

export const collections = {
  raidStats: 'raid-stats',
  labels: 'labels',
};
