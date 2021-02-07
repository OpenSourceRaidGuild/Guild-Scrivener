import * as firebaseUtils from '@firebase/testing';

const PROJECT_ID = 'raid-stats-c1d5a';

const firebase = firebaseUtils.initializeAdminApp({
  projectId: PROJECT_ID,
});

export const firestore = firebase.firestore();

export function resetFirestore() {
  return firebaseUtils.clearFirestoreData({
    projectId: PROJECT_ID,
  });
}

export async function cleanupApps() {
  firebaseUtils.apps().map(async (a) => await a.delete());
}
