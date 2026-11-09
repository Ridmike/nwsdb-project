import { isDemoMode } from '../firebase/config';
import { getDemoReports } from '../demo/store';
import { apiRequest } from './apiClient';

export async function getReportSummary() {
  if (isDemoMode) {
    return getDemoReports();
  }
  const payload = await apiRequest('/reports/summary');
  return payload.data;
}
