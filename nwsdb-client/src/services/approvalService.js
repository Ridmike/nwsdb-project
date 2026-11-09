import { isDemoMode } from '../firebase/config';
import {
  createDemoApproval,
  listDemoApprovals,
  updateDemoApproval
} from '../demo/store';
import { apiRequest, toQueryString } from './apiClient';

export async function listApprovals(filters = {}) {
  if (isDemoMode) {
    return listDemoApprovals(filters);
  }
  const payload = await apiRequest(`/approvals${toQueryString(filters)}`);
  return payload.data || [];
}

export async function createApproval(fileId, input) {
  if (isDemoMode) {
    return createDemoApproval(fileId, input);
  }
  const payload = await apiRequest(`/files/${fileId}/approvals`, {
    method: 'POST',
    body: input
  });
  return payload.data;
}

export async function updateApproval(fileId, approvalId, input) {
  if (isDemoMode) {
    return updateDemoApproval(fileId, approvalId, input);
  }
  const payload = await apiRequest(`/files/${fileId}/approvals/${approvalId}`, {
    method: 'PATCH',
    body: input
  });
  return payload.data;
}
