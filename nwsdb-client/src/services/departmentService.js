import { isDemoMode } from '../firebase/config';
import {
  createDemoDepartment,
  getDemoDepartments,
  updateDemoDepartment
} from '../demo/store';
import { apiRequest } from './apiClient';

export async function listDepartments() {
  if (isDemoMode) {
    return getDemoDepartments();
  }
  const payload = await apiRequest('/departments');
  return payload.data || [];
}

export async function createDepartment(input) {
  if (isDemoMode) {
    return createDemoDepartment(input);
  }
  const payload = await apiRequest('/departments', { method: 'POST', body: input });
  return payload.data;
}

export async function updateDepartment(id, input) {
  if (isDemoMode) {
    return updateDemoDepartment(id, input);
  }
  const payload = await apiRequest(`/departments/${id}`, { method: 'PATCH', body: input });
  return payload.data;
}
