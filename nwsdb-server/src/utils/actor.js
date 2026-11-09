function actorFromRequest(user = {}) {
  return {
    uid: user.uid || '',
    role: user.role || 'staff',
    displayName: user.name || user.email || 'Staff member',
    section: user.section || '',
    office: user.office || ''
  };
}

module.exports = { actorFromRequest };
