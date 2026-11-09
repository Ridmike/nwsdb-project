import {
  getIdTokenResult,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/config';

const LOGIN_EMAIL_DOMAIN = (import.meta.env.VITE_LOGIN_EMAIL_DOMAIN || 'nwsdb.lk').replace(
  /^@/,
  ''
);

export function toLoginEmail(identifier) {
  const value = String(identifier || '').trim();
  if (!value) {
    return '';
  }
  return value.includes('@') ? value : `${value}@${LOGIN_EMAIL_DOMAIN}`;
}

const AUTH_ERROR_MESSAGES = {
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled. Please contact the system administrator.',
  'auth/user-not-found': 'No account was found for this email address.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/invalid-login-credentials': 'Incorrect email or password.',
  'auth/too-many-requests': 'Too many unsuccessful attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/unauthorized-domain': 'This domain is not authorised in Firebase Authentication.',
  'auth/operation-not-allowed': 'Email/password sign-in is not enabled in Firebase.',
  'auth/api-key-not-valid': 'Firebase configuration is invalid. Check the client .env file.',
  'auth/configuration-not-found': 'Firebase Authentication is not configured correctly.'
};

export function getFriendlyAuthError(error) {
  if (!error) {
    return 'Sign in failed. Please try again.';
  }
  if (error.code && AUTH_ERROR_MESSAGES[error.code]) {
    return AUTH_ERROR_MESSAGES[error.code];
  }
  return error.message || 'Sign in failed. Please try again.';
}

function ensureConfigured() {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase is not configured. Add the VITE_FIREBASE_* values to nwsdb-client/.env.'
    );
  }
}

export async function loginWithEmail(email, password) {
  ensureConfigured();
  return signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  if (!isFirebaseConfigured) {
    return;
  }
  await signOut(auth);
}

export async function sendReset(email) {
  ensureConfigured();
  await sendPasswordResetEmail(auth, email);
}

export async function getClaims(user, forceRefresh = false) {
  if (!user) {
    return {};
  }
  const tokenResult = await getIdTokenResult(user, forceRefresh);
  return tokenResult.claims || {};
}
