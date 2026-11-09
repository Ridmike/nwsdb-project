const { getFirebaseFirestore } = require('../config/firebase');

async function writeAudit({ actor, action, entityType, entityId, details }) {
  try {
    await getFirebaseFirestore()
      .collection('audit')
      .add({
        actorUid: actor?.uid || '',
        actorName: actor?.displayName || 'System',
        action,
        entityType,
        entityId: entityId || '',
        details: details || '',
        createdAt: new Date().toISOString()
      });
  } catch (error) {
    console.warn(`[audit] Could not record "${action}": ${error.message}`);
  }
}

module.exports = { writeAudit };
