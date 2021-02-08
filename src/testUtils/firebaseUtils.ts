import * as firebaseUtils from '@firebase/testing';
import faker from 'faker';

const PROJECT_ID = 'test-' + faker.git.shortSha();

// Makes the firebase instance used by the app point to our test instance
process.env.FIREBASE_PROJECT_ID = PROJECT_ID;

export const firestore = firebaseUtils
  .initializeAdminApp({
    projectId: PROJECT_ID,
  })
  .firestore();

export async function resetFirestore() {
  await firebaseUtils.clearFirestoreData({
    projectId: PROJECT_ID,
  });
}

export async function cleanupFirebaseApps() {
  await Promise.all(firebaseUtils.apps().map(async (a) => await a.delete()));
}
