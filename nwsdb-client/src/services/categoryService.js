import { isDemoMode } from '../firebase/config';
import {
  createDemoCategory,
  getDemoCategories,
  updateDemoCategory
} from '../demo/store';
import { apiRequest } from './apiClient';

export async function listCategories() {
  if (isDemoMode) {
    return getDemoCategories();
  }
  const payload = await apiRequest('/error-categories');
  return payload.data || [];
}

export async function createCategory(input) {
  if (isDemoMode) {
    return createDemoCategory(input);
  }
  const payload = await apiRequest('/error-categories', { method: 'POST', body: input });
  return payload.data;
}

export async function updateCategory(id, input) {
  if (isDemoMode) {
    return updateDemoCategory(id, input);
  }
  const payload = await apiRequest(`/error-categories/${id}`, { method: 'PATCH', body: input });
  return payload.data;
}
