const { applicationDefault, cert, getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

let appInstance = null;

function buildOptions() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    return {
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id
    };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : '';

  if (projectId && clientEmail && privateKey) {
    return {
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId
    };
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return {
      credential: applicationDefault()
    };
  }

  const error = new Error(
    'Firebase Admin is not configured on the server. Add FIREBASE_PROJECT_ID, ' +
      'FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY (or FIREBASE_SERVICE_ACCOUNT_JSON) ' +
      'to nwsdb-server/.env.'
  );
  error.status = 503;
  throw error;
}

function getFirebaseApp() {
  if (appInstance) {
    return appInstance;
  }

  const existing = getApps();
  if (existing.length) {
    appInstance = existing[0];
    return appInstance;
  }

  appInstance = initializeApp(buildOptions());
  return appInstance;
}

function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

function getFirebaseFirestore() {
  return getFirestore(getFirebaseApp());
}

function isFirebaseAdminConfigured() {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
      (process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY) ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS
  );
}

module.exports = {
  getFirebaseApp,
  getFirebaseAuth,
  getFirebaseFirestore,
  isFirebaseAdminConfigured
};
