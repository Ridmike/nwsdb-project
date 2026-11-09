import { isDemoMode } from '../firebase/config';
import {
  createDemoUser,
  getDemoUsers,
  resetDemoUserPassword,
  updateDemoUser
} from '../demo/store';
import { apiRequest } from './apiClient';

export async function listUsers() {
  if (isDemoMode) {
    return getDemoUsers();
  }
  const payload = await apiRequest('/users');
  return payload.users || [];
}

export async function listUserDirectory() {
  if (isDemoMode) {
    return getDemoUsers();
  }
  const payload = await apiRequest('/users/directory');
  return payload.users || [];
}

export async function createUser(input) {
  if (isDemoMode) {
    return createDemoUser(input);
  }
  const payload = await apiRequest('/users', { method: 'POST', body: input });
  return payload.user;
}

export async function updateUser(uid, input) {
  if (isDemoMode) {
    return updateDemoUser(uid, input);
  }
  const payload = await apiRequest(`/users/${uid}`, { method: 'PATCH', body: input });
  return payload.user;
}

export async function resetUserPassword(uid, continueUrl) {
  if (isDemoMode) {
    return resetDemoUserPassword(uid);
  }
  const payload = await apiRequest(`/users/${uid}/reset-password`, {
    method: 'POST',
    body: { continueUrl }
  });
  return payload;
}
