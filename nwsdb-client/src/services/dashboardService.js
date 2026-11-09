import { isDemoMode } from '../firebase/config';
import { getDemoDashboard } from '../demo/store';
import { apiRequest } from './apiClient';

export async function getDashboardSummary() {
  if (isDemoMode) {
    return getDemoDashboard();
  }
  const payload = await apiRequest('/dashboard/summary');
  return payload.data;
}
