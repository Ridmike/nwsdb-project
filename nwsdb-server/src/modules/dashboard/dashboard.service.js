const { getFirebaseFirestore } = require('../../config/firebase');
const { actorFromRequest } = require('../../utils/actor');
const { ACTIVE_STATUSES } = require('../files/files.service');
const { loadLookups, decorateFile, decorateApproval } = require('../../utils/data');

function canSeeApproval(actor, approval) {
  if (['admin', 'manager'].includes(actor.role)) {
    return true;
  }
  return approval.assignedUid === actor.uid || approval.assignedRole === actor.role;
}

async function getDashboardSummary(user) {
  const db = getFirebaseFirestore();
  const actor = actorFromRequest(user);

  const [fileSnapshot, approvalSnapshot, lookups] = await Promise.all([
    db.collection('files').orderBy('registeredAt', 'desc').limit(1000).get(),
    db.collectionGroup('approvals').where('status', '==', 'pending').limit(500).get(),
    loadLookups(db)
  ]);

  const files = fileSnapshot.docs.map((doc) =>
    decorateFile({ id: doc.id, ...doc.data() }, lookups)
  );
  const activeFiles = files.filter((file) => ACTIVE_STATUSES.includes(file.status));

  const averageAgeDays = activeFiles.length
    ? Math.round(
        activeFiles.reduce((total, file) => total + (file.ageDays || 0), 0) /
          activeFiles.length
      )
    : 0;

  const counts = {
    total: files.length,
    open: files.filter((file) => file.status === 'open').length,
    pendingReceipt: files.filter((file) => file.status === 'pending_receipt').length,
    pendingApproval: files.filter((file) => file.status === 'pending_approval').length,
    completed: files.filter((file) => file.status === 'completed').length,
    cancelled: files.filter((file) => file.status === 'cancelled').length,
    overdue: files.filter((file) => file.overdue).length,
    averageAgeDays
  };

  const overdueFiles = files
    .filter((file) => file.overdue)
    .sort(
      (left, right) =>
        new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime()
    )
    .slice(0, 6);

  const awaitingReceipt = files
    .filter((file) => file.status === 'pending_receipt')
    .sort(
      (left, right) =>
        new Date(right.lastMovementAt || right.updatedAt).getTime() -
        new Date(left.lastMovementAt || left.updatedAt).getTime()
    )
    .slice(0, 6);

  const fileById = new Map(files.map((file) => [file.id, file]));
  const pendingApprovals = approvalSnapshot.docs
    .map((doc) => ({
      id: doc.id,
      fileId: doc.ref.parent.parent.id,
      ...doc.data()
    }))
    .filter((approval) => canSeeApproval(actor, approval))
    .map((approval) =>
      decorateApproval(approval, fileById.get(approval.fileId) || null, lookups)
    )
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    )
    .slice(0, 6);

  const heldByMap = new Map();
  for (const file of activeFiles) {
    const key = file.currentHolderName || 'Unassigned';
    heldByMap.set(key, (heldByMap.get(key) || 0) + 1);
  }
  const heldBy = Array.from(heldByMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 8);

  const categoryMap = new Map();
  for (const file of files) {
    const name = file.categoryName || 'Uncategorised';
    categoryMap.set(name, (categoryMap.get(name) || 0) + 1);
  }
  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count);

  return {
    counts,
    overdueFiles,
    awaitingReceipt,
    pendingApprovals,
    heldBy,
    categoryBreakdown,
    recentFiles: files.slice(0, 6)
  };
}

module.exports = { getDashboardSummary };
