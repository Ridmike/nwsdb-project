import { isDemoMode } from '../firebase/config';
import {
  completeDemoFile,
  createDemoFile,
  createDemoMovement,
  getDemoFile,
  listDemoFiles,
  listDemoMovements,
  receiveDemoMovement,
  updateDemoFile
} from '../demo/store';
import { apiRequest, toQueryString } from './apiClient';

export async function listFiles(filters = {}) {
  if (isDemoMode) {
    return listDemoFiles(filters);
  }
  const payload = await apiRequest(`/files${toQueryString(filters)}`);
  return payload.data || [];
}

export async function getFile(fileId) {
  if (isDemoMode) {
    return getDemoFile(fileId);
  }
  const payload = await apiRequest(`/files/${fileId}`);
  return payload.data;
}

export async function createFile(input) {
  if (isDemoMode) {
    return createDemoFile(input);
  }
  const payload = await apiRequest('/files', { method: 'POST', body: input });
  return payload.data;
}

export async function updateFile(fileId, input) {
  if (isDemoMode) {
    return updateDemoFile(fileId, input);
  }
  const payload = await apiRequest(`/files/${fileId}`, { method: 'PATCH', body: input });
  return payload.data;
}

export async function completeFile(fileId) {
  if (isDemoMode) {
    return completeDemoFile(fileId);
  }
  const payload = await apiRequest(`/files/${fileId}/complete`, { method: 'POST' });
  return payload.data;
}

export async function listMovements(fileId) {
  if (isDemoMode) {
    return listDemoMovements(fileId);
  }
  const payload = await apiRequest(`/files/${fileId}/movements`);
  return payload.data || [];
}

export async function createMovement(fileId, input) {
  if (isDemoMode) {
    return createDemoMovement(fileId, input);
  }
  const payload = await apiRequest(`/files/${fileId}/movements`, {
    method: 'POST',
    body: input
  });
  return payload.data;
}

export async function receiveMovement(fileId, movementId, input = {}) {
  if (isDemoMode) {
    return receiveDemoMovement(fileId, movementId, input);
  }
  const payload = await apiRequest(`/files/${fileId}/movements/${movementId}/receive`, {
    method: 'POST',
    body: input
  });
  return payload.data;
}
