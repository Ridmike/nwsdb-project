const { getFirebaseFirestore } = require('../../config/firebase');
const { actorFromRequest } = require('../../utils/actor');
const { loadLookups, decorateFile, decorateApproval } = require('../../utils/data');

function canSeeApproval(actor, approval) {
  if (['admin', 'manager'].includes(actor.role)) {
    return true;
  }
  return approval.assignedUid === actor.uid || approval.assignedRole === actor.role;
}

async function listApprovals(filters = {}, user) {
  const db = getFirebaseFirestore();
  const actor = actorFromRequest(user);

  let query = db.collectionGroup('approvals');
  if (filters.status) {
    query = query.where('status', '==', filters.status);
  }

  const [snapshot, lookups] = await Promise.all([query.limit(500).get(), loadLookups(db)]);

  let approvals = snapshot.docs.map((doc) => ({
    id: doc.id,
    fileId: doc.ref.parent.parent.id,
    ...doc.data()
  }));

  if (filters.mine) {
    approvals = approvals.filter((approval) => canSeeApproval(actor, approval));
  }

  const fileIds = [...new Set(approvals.map((approval) => approval.fileId))];
  const fileSnapshots = await Promise.all(
    fileIds.map((fileId) => db.collection('files').doc(fileId).get())
  );

  const files = new Map();
  for (const fileSnapshot of fileSnapshots) {
    if (fileSnapshot.exists) {
      files.set(fileSnapshot.id, { id: fileSnapshot.id, ...fileSnapshot.data() });
    }
  }

  const decorated = approvals.map((approval) => {
    const file = files.get(approval.fileId) || null;
    return {
      ...decorateApproval(
        approval,
        file ? decorateFile(file, lookups) : null,
        lookups
      ),
      fileId: approval.fileId
    };
  });

  decorated.sort((left, right) => {
    if (left.status === 'pending' && right.status !== 'pending') {
      return -1;
    }
    if (right.status === 'pending' && left.status !== 'pending') {
      return 1;
    }
    return new Date(right.actionAt || right.createdAt).getTime() -
      new Date(left.actionAt || left.createdAt).getTime();
  });

  return decorated;
}

module.exports = { listApprovals };
