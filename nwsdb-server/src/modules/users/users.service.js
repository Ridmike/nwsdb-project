const { FieldValue } = require('firebase-admin/firestore');
const { getFirebaseAuth, getFirebaseFirestore } = require('../../config/firebase');

const VALID_ROLES = ['admin', 'crc', 'oic', 'co', 'ae', 'manager', 'rsc', 'staff'];

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function translateAuthError(error) {
  const map = {
    'auth/email-already-exists': [409, 'An account with this email address already exists.'],
    'auth/invalid-email': [400, 'Enter a valid email address.'],
    'auth/invalid-password': [400, 'Password must be at least 6 characters.'],
    'auth/user-not-found': [404, 'User account was not found.'],
    'auth/uid-already-exists': [409, 'A user with this ID already exists.']
  };

  const mapped = map[error.code];
  if (mapped) {
    return httpError(mapped[0], mapped[1]);
  }

  return httpError(error.status || 500, error.message || 'The user operation failed.');
}

function toProfile(record) {
  const claims = record.customClaims || {};

  return {
    uid: record.uid,
    email: record.email || '',
    displayName: record.displayName || '',
    role: claims.role || 'staff',
    section: claims.section || '',
    office: claims.office || '',
    active: claims.active !== false && !record.disabled,
    disabled: Boolean(record.disabled),
    createdAt: record.metadata?.creationTime || null,
    lastSignInTime: record.metadata?.lastSignInTime || null
  };
}

async function syncProfile(uid, profile) {
  try {
    await getFirebaseFirestore()
      .collection('users')
      .doc(uid)
      .set(
        {
          ...profile,
          updatedAt: FieldValue.serverTimestamp()
        },
        { merge: true }
      );
  } catch (error) {
    console.warn(`[users] Firestore profile sync skipped for ${uid}: ${error.message}`);
  }
}

async function listUsers() {
  const collected = [];
  let pageToken;

  do {
    const result = await getFirebaseAuth().listUsers(1000, pageToken);
    collected.push(...result.users);
    pageToken = result.pageToken;
  } while (pageToken);

  return collected
    .map(toProfile)
    .sort((a, b) =>
      (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '')
    );
}

async function listDirectory() {
  const users = await listUsers();
  return users
    .filter((user) => user.active)
    .map(({ uid, displayName, role, section, office, active }) => ({
      uid,
      displayName,
      role,
      section,
      office,
      active
    }));
}

async function createUser(input = {}) {
  const email = String(input.email || '').trim().toLowerCase();
  const password = String(input.password || '');
  const displayName = String(input.displayName || '').trim();
  const role = input.role || 'staff';
  const section = String(input.section || '').trim();
  const office = String(input.office || '').trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw httpError(400, 'A valid email address is required.');
  }
  if (!displayName) {
    throw httpError(400, 'Full name is required.');
  }
  if (password.length < 6) {
    throw httpError(400, 'Temporary password must be at least 6 characters.');
  }
  if (!VALID_ROLES.includes(role)) {
    throw httpError(400, 'Select a valid role for the user.');
  }

  const auth = getFirebaseAuth();
  let record;

  try {
    record = await auth.createUser({ email, password, displayName });
  } catch (error) {
    throw translateAuthError(error);
  }

  const claims = { role, active: true, section, office };
  await auth.setCustomUserClaims(record.uid, claims);

  const profile = toProfile({ ...record, customClaims: claims });
  await syncProfile(record.uid, profile);

  return profile;
}

async function updateUser(uid, input = {}) {
  if (!uid) {
    throw httpError(400, 'A user ID is required.');
  }

  const auth = getFirebaseAuth();
  let record;

  try {
    record = await auth.getUser(uid);
  } catch (error) {
    throw translateAuthError(error);
  }

  const currentClaims = record.customClaims || {};
  const role = input.role !== undefined ? input.role : currentClaims.role || 'staff';

  if (!VALID_ROLES.includes(role)) {
    throw httpError(400, 'Select a valid role for the user.');
  }

  const active =
    input.active !== undefined
      ? Boolean(input.active)
      : currentClaims.active !== false && !record.disabled;
  const displayName =
    input.displayName !== undefined
      ? String(input.displayName).trim()
      : record.displayName || '';

  if (!displayName) {
    throw httpError(400, 'Full name is required.');
  }

  const section =
    input.section !== undefined
      ? String(input.section).trim()
      : String(currentClaims.section || '');
  const office =
    input.office !== undefined
      ? String(input.office).trim()
      : String(currentClaims.office || '');

  try {
    await auth.updateUser(uid, { displayName, disabled: !active });
  } catch (error) {
    throw translateAuthError(error);
  }

  const claims = { ...currentClaims, role, active, section, office };
  await auth.setCustomUserClaims(uid, claims);

  const profile = toProfile({
    ...record,
    displayName,
    disabled: !active,
    customClaims: claims
  });
  await syncProfile(uid, profile);

  return profile;
}

async function createResetLink(uid, continueUrl) {
  if (!uid) {
    throw httpError(400, 'A user ID is required.');
  }

  const auth = getFirebaseAuth();
  let record;

  try {
    record = await auth.getUser(uid);
  } catch (error) {
    throw translateAuthError(error);
  }

  if (!record.email) {
    throw httpError(400, 'This account does not have an email address.');
  }

  const fallbackUrl = `${(process.env.CLIENT_ORIGIN || 'http://localhost:5173').replace(/\/$/, '')}/login`;
  const url = typeof continueUrl === 'string' && /^https?:\/\//i.test(continueUrl) ? continueUrl : fallbackUrl;

  const resetLink = await auth.generatePasswordResetLink(record.email, {
    url,
    handleCodeInApp: false
  });

  return { email: record.email, resetLink };
}

module.exports = {
  VALID_ROLES,
  listUsers,
  listDirectory,
  createUser,
  updateUser,
  createResetLink
};
