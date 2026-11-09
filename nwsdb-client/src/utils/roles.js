export const ROLES = [
  { value: 'admin', label: 'System Administrator', short: 'Admin' },
  { value: 'crc', label: 'CRC / Consumer Relations', short: 'CRC' },
  { value: 'oic', label: 'OIC Officer', short: 'OIC' },
  { value: 'co', label: 'Commercial Officer (CO)', short: 'CO' },
  { value: 'ae', label: 'Area Engineer (AE)', short: 'AE' },
  { value: 'manager', label: 'Manager', short: 'Manager' },
  { value: 'rsc', label: 'RSC Officer', short: 'RSC' },
  { value: 'staff', label: 'Office Staff', short: 'Staff' }
];

export const ROLE_LABELS = ROLES.reduce((labels, role) => {
  labels[role.value] = role.label;
  return labels;
}, {});

export const ROLE_SHORT_LABELS = ROLES.reduce((labels, role) => {
  labels[role.value] = role.short;
  return labels;
}, {});

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || 'Office Staff';
}

export function getRoleShortLabel(role) {
  return ROLE_SHORT_LABELS[role] || 'Staff';
}

export function canCreateFiles(role) {
  return role === 'admin' || role === 'crc';
}

export function canEditFiles(role) {
  return role === 'admin' || role === 'crc';
}

export function canCompleteFiles(role) {
  return role === 'admin' || role === 'manager';
}

export function canManageUsers(role) {
  return role === 'admin';
}

export function canManageReferenceData(role) {
  return role === 'admin';
}

export function canViewReports(role) {
  return role === 'admin' || role === 'manager' || role === 'rsc';
}

export function canAddApprovals(role) {
  return role === 'admin' || role === 'crc' || role === 'manager';
}

export function canActOnApproval(actor, approval) {
  if (!actor || !approval) {
    return false;
  }
  return (
    actor.role === 'admin' ||
    approval.assignedUid === actor.uid ||
    approval.assignedRole === actor.role
  );
}
