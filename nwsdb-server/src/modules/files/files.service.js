const { getFirebaseAuth, getFirebaseFirestore } = require('../../config/firebase');
const { httpError } = require('../../utils/http');
const { writeAudit } = require('../../utils/audit');
const {
  DAY,
  departmentBySection,
  loadLookups,
  decorateFile,
  decorateApproval
} = require('../../utils/data');

const VALID_ROLES = ['admin', 'crc', 'oic', 'co', 'ae', 'manager', 'rsc', 'staff'];
const ACTIVE_STATUSES = ['open', 'pending_receipt', 'pending_approval'];

function toFile(doc) {
  return { id: doc.id, ...doc.data() };
}

function toMovement(doc) {
  return { id: doc.id, ...doc.data() };
}

function toApproval(doc) {
  return { id: doc.id, ...doc.data() };
}

async function getUserProfile(uid) {
  if (!uid) {
    return null;
  }

  const db = getFirebaseFirestore();
  const snapshot = await db.collection('users').doc(uid).get();

  if (snapshot.exists) {
    return { uid, ...snapshot.data() };
  }

  try {
    const record = await getFirebaseAuth().getUser(uid);
    const claims = record.customClaims || {};
    return {
      uid: record.uid,
      displayName: record.displayName || record.email || '',
      email: record.email || '',
      role: claims.role || 'staff',
      section: claims.section || '',
      office: claims.office || '',
      active: claims.active !== false && !record.disabled
    };
  } catch {
    return null;
  }
}

async function getActorProfile(user) {
  const profile = await getUserProfile(user.uid).catch(() => null);
  if (profile) {
    return profile;
  }
  return {
    uid: user.uid,
    displayName: user.name || user.email || 'Staff member',
    role: user.role || 'staff',
    section: user.section || '',
    office: user.office || ''
  };
}

async function nextReference() {
  const db = getFirebaseFirestore();
  const year = new Date().getFullYear();
  const counterRef = db.collection('counters').doc(`files-${year}`);
  const sequence = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(counterRef);
    const current = snapshot.exists ? Number(snapshot.data().value) || 0 : 0;
    const next = current + 1;
    transaction.set(
      counterRef,
      { value: next, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    return next;
  });

  return `WBA/${year}/${String(sequence).padStart(4, '0')}`;
}

function normalizeDueDate(value) {
  if (!value) {
    return new Date(Date.now() + 14 * DAY).toISOString();
  }
  const candidate = String(value).includes('T')
    ? new Date(value)
    : new Date(`${value}T17:00:00`);
  if (Number.isNaN(candidate.getTime())) {
    throw httpError(400, 'Enter a valid due date.');
  }
  return candidate.toISOString();
}

async function listFiles(filters = {}) {
  const db = getFirebaseFirestore();
  const [snapshot, lookups] = await Promise.all([
    db.collection('files').orderBy('registeredAt', 'desc').limit(1000).get(),
    loadLookups(db)
  ]);

  const search = String(filters.search || '').trim().toLowerCase();
  let files = snapshot.docs.map((doc) => decorateFile(toFile(doc), lookups));

  if (filters.status) {
    files = files.filter((file) => file.status === filters.status);
  }
  if (filters.categoryId) {
    files = files.filter((file) => file.categoryId === filters.categoryId);
  }
  if (filters.holderUid) {
    files = files.filter((file) => file.currentHolderUid === filters.holderUid);
  }
  if (filters.overdue) {
    files = files.filter((file) => file.overdue);
  }
  if (search) {
    files = files.filter((file) =>
      [
        file.reference,
        file.complaintNo,
        file.consumerName,
        file.consumerPhone,
        file.consumerAddress,
        file.categoryName,
        file.subCategoryName,
        file.currentHolderName
      ]
        .join(' ')
        .toLowerCase()
        .includes(search)
    );
  }

  return files;
}

async function getFile(fileId) {
  const db = getFirebaseFirestore();
  const fileRef = db.collection('files').doc(fileId);
  const [snapshot, lookups] = await Promise.all([fileRef.get(), loadLookups(db)]);

  if (!snapshot.exists) {
    throw httpError(404, 'File not found.');
  }

  const file = toFile(snapshot);
  const [movementsSnapshot, approvalsSnapshot] = await Promise.all([
    fileRef.collection('movements').orderBy('handoverAt', 'asc').get(),
    fileRef.collection('approvals').orderBy('sequence', 'asc').get()
  ]);

  const decorated = decorateFile(file, lookups);

  return {
    ...decorated,
    movements: movementsSnapshot.docs.map(toMovement),
    approvals: approvalsSnapshot.docs.map((doc) =>
      decorateApproval(toApproval(doc), decorated, lookups)
    )
  };
}

async function createFile(input = {}, user) {
  const db = getFirebaseFirestore();
  const actor = await getActorProfile(user);

  if (!['admin', 'crc'].includes(actor.role)) {
    throw httpError(403, 'Only administrators and CRC staff can register files.');
  }

  const consumerName = String(input.consumerName || '').trim();
  const description = String(input.description || '').trim();
  const categoryId = String(input.categoryId || '').trim();

  if (!consumerName) {
    throw httpError(400, 'Consumer name is required.');
  }
  if (!categoryId) {
    throw httpError(400, 'Select an error category.');
  }
  if (!description) {
    throw httpError(400, 'Complaint description is required.');
  }

  const lookups = await loadLookups(db);
  const category = lookups.categories.find((item) => item.id === categoryId && !item.parentId);
  if (!category) {
    throw httpError(400, 'Select a valid main error category.');
  }

  const subCategoryId = String(input.subCategoryId || '');
  if (subCategoryId) {
    const subCategory = lookups.categories.find(
      (item) => item.id === subCategoryId && item.parentId === categoryId
    );
    if (!subCategory) {
      throw httpError(400, 'Select a valid subcategory.');
    }
  }

  const now = new Date().toISOString();
  const reference = await nextReference();
  const department = departmentBySection(lookups, actor.section);

  const record = {
    reference,
    complaintNo: String(input.complaintNo || '').trim(),
    consumerName,
    consumerAddress: String(input.consumerAddress || '').trim(),
    consumerPhone: String(input.consumerPhone || '').trim(),
    billMonth: String(input.billMonth || '').trim(),
    billAmount: Number(input.billAmount) || 0,
    adjustmentAmount: Number(input.adjustmentAmount) || 0,
    categoryId,
    subCategoryId,
    description,
    priority: input.priority === 'urgent' ? 'urgent' : 'normal',
    status: 'open',
    currentHolderUid: actor.uid,
    currentHolderName: actor.displayName,
    currentDepartmentId: department?.id || null,
    registeredByUid: actor.uid,
    registeredByName: actor.displayName,
    registeredAt: now,
    dueDate: normalizeDueDate(input.dueDate),
    lastMovementAt: null,
    pendingMovementId: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now
  };

  const ref = await db.collection('files').add(record);
  await writeAudit({
    actor,
    action: 'file.created',
    entityType: 'file',
    entityId: ref.id,
    details: `Registered ${reference} for ${consumerName}.`
  });

  return decorateFile({ id: ref.id, ...record }, lookups);
}

async function updateFile(fileId, input = {}, user) {
  const db = getFirebaseFirestore();
  const actor = await getActorProfile(user);
  const fileRef = db.collection('files').doc(fileId);
  const snapshot = await fileRef.get();

  if (!snapshot.exists) {
    throw httpError(404, 'File not found.');
  }

  const file = toFile(snapshot);

  if (!['admin', 'crc'].includes(actor.role)) {
    throw httpError(403, 'Only administrators and CRC staff can edit file details.');
  }
  if (['completed', 'cancelled'].includes(file.status)) {
    throw httpError(400, 'Completed or cancelled files cannot be edited.');
  }

  const lookups = await loadLookups(db);
  const updates = {};

  for (const field of [
    'complaintNo',
    'consumerName',
    'consumerAddress',
    'consumerPhone',
    'billMonth',
    'description'
  ]) {
    if (input[field] !== undefined) {
      updates[field] = String(input[field]).trim();
    }
  }

  if (updates.consumerName === '') {
    throw httpError(400, 'Consumer name is required.');
  }
  if (updates.description === '') {
    throw httpError(400, 'Complaint description is required.');
  }

  if (input.billAmount !== undefined) {
    updates.billAmount = Number(input.billAmount) || 0;
  }
  if (input.adjustmentAmount !== undefined) {
    updates.adjustmentAmount = Number(input.adjustmentAmount) || 0;
  }
  if (input.priority !== undefined) {
    updates.priority = input.priority === 'urgent' ? 'urgent' : 'normal';
  }
  if (input.categoryId !== undefined) {
    const category = lookups.categories.find(
      (item) => item.id === input.categoryId && !item.parentId
    );
    if (!category) {
      throw httpError(400, 'Select a valid main error category.');
    }
    updates.categoryId = input.categoryId;
  }
  if (input.subCategoryId !== undefined) {
    const parentId = updates.categoryId || file.categoryId;
    const subCategoryId = String(input.subCategoryId || '');
    if (subCategoryId) {
      const subCategory = lookups.categories.find(
        (item) => item.id === subCategoryId && item.parentId === parentId
      );
      if (!subCategory) {
        throw httpError(400, 'Select a valid subcategory.');
      }
    }
    updates.subCategoryId = subCategoryId;
  }
  if (input.dueDate !== undefined) {
    updates.dueDate = input.dueDate ? normalizeDueDate(input.dueDate) : null;
  }

  updates.updatedAt = new Date().toISOString();
  await fileRef.set(updates, { merge: true });
  await writeAudit({
    actor,
    action: 'file.updated',
    entityType: 'file',
    entityId: fileId,
    details: `Updated details for ${file.reference}.`
  });

  return decorateFile({ ...file, ...updates, id: fileId }, lookups);
}

async function completeFile(fileId, user) {
  const db = getFirebaseFirestore();
  const actor = await getActorProfile(user);

  if (!['admin', 'manager'].includes(actor.role)) {
    throw httpError(403, 'Only administrators and managers can close files.');
  }

  const fileRef = db.collection('files').doc(fileId);
  const snapshot = await fileRef.get();
  if (!snapshot.exists) {
    throw httpError(404, 'File not found.');
  }

  const file = toFile(snapshot);
  if (file.pendingMovementId) {
    throw httpError(400, 'Confirm the pending receipt before closing this file.');
  }
  if (file.status === 'completed') {
    throw httpError(400, 'This file is already completed.');
  }
  if (file.status === 'cancelled') {
    throw httpError(400, 'This file was cancelled.');
  }

  const pendingApprovals = await fileRef
    .collection('approvals')
    .where('status', '==', 'pending')
    .limit(1)
    .get();
  if (!pendingApprovals.empty) {
    throw httpError(400, 'Complete pending approval steps before closing this file.');
  }

  const now = new Date().toISOString();
  await fileRef.set(
    { status: 'completed', completedAt: now, updatedAt: now, pendingMovementId: null },
    { merge: true }
  );
  await writeAudit({
    actor,
    action: 'file.completed',
    entityType: 'file',
    entityId: fileId,
    details: `Closed ${file.reference}.`
  });

  const lookups = await loadLookups(db);
  return decorateFile({ ...file, status: 'completed', completedAt: now, updatedAt: now }, lookups);
}

async function listMovements(fileId) {
  const db = getFirebaseFirestore();
  const snapshot = await db
    .collection('files')
    .doc(fileId)
    .collection('movements')
    .orderBy('handoverAt', 'desc')
    .get();
  return snapshot.docs.map(toMovement);
}

async function createMovement(fileId, input = {}, user) {
  const db = getFirebaseFirestore();
  const actor = await getActorProfile(user);
  const fileRef = db.collection('files').doc(fileId);
  const snapshot = await fileRef.get();

  if (!snapshot.exists) {
    throw httpError(404, 'File not found.');
  }

  const file = toFile(snapshot);

  if (['completed', 'cancelled'].includes(file.status)) {
    throw httpError(400, 'Completed or cancelled files cannot be moved.');
  }
  if (file.pendingMovementId) {
    throw httpError(400, 'Confirm the previous receipt before handing over again.');
  }
  if (
    !['admin', 'manager'].includes(actor.role) &&
    actor.uid !== file.currentHolderUid
  ) {
    throw httpError(403, 'Only the current holder can hand over this file.');
  }

  const recipient = await getUserProfile(String(input.toUid || '').trim());
  if (!recipient) {
    throw httpError(400, 'Select a valid recipient.');
  }
  if (recipient.uid === actor.uid) {
    throw httpError(400, 'Select a different recipient.');
  }
  if (recipient.active === false) {
    throw httpError(400, 'The selected recipient account is disabled.');
  }

  const lookups = await loadLookups(db);
  const recipientDepartment = departmentBySection(lookups, recipient.section);
  const handoverAt = input.handoverAt ? new Date(input.handoverAt).toISOString() : new Date().toISOString();

  const movement = {
    fileId,
    type: input.type === 'return' ? 'return' : 'handover',
    fromUid: actor.uid,
    fromName: actor.displayName,
    fromDepartmentId: file.currentDepartmentId || null,
    toUid: recipient.uid,
    toName: recipient.displayName,
    toDepartmentId: recipientDepartment?.id || file.currentDepartmentId || null,
    handoverAt,
    handoverByUid: actor.uid,
    receiptAt: null,
    receiptByUid: null,
    status: 'handed_over',
    notes: String(input.notes || '').trim(),
    delayReason: String(input.delayReason || '').trim(),
    createdAt: new Date().toISOString()
  };

  const movementRef = await fileRef.collection('movements').add(movement);
  await fileRef.set(
    {
      status: 'pending_receipt',
      pendingMovementId: movementRef.id,
      lastMovementAt: handoverAt,
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );
  await writeAudit({
    actor,
    action: 'movement.created',
    entityType: 'file',
    entityId: fileId,
    details: `Handed over ${file.reference} to ${recipient.displayName}.`
  });

  return { id: movementRef.id, ...movement };
}

async function receiveMovement(fileId, movementId, input = {}, user) {
  const db = getFirebaseFirestore();
  const actor = await getActorProfile(user);
  const fileRef = db.collection('files').doc(fileId);
  const movementRef = fileRef.collection('movements').doc(movementId);
  const [fileSnapshot, movementSnapshot] = await Promise.all([fileRef.get(), movementRef.get()]);

  if (!fileSnapshot.exists || !movementSnapshot.exists) {
    throw httpError(404, 'Movement not found.');
  }

  const file = toFile(fileSnapshot);
  const movement = toMovement(movementSnapshot);

  if (movement.receiptAt) {
    throw httpError(400, 'Receipt has already been confirmed.');
  }
  if (file.pendingMovementId && file.pendingMovementId !== movementId) {
    throw httpError(400, 'This movement is not the pending handover.');
  }
  if (!['admin', 'manager'].includes(actor.role) && actor.uid !== movement.toUid) {
    throw httpError(403, 'Only the intended recipient can confirm receipt.');
  }

  const receiptAt = input.receiptAt
    ? new Date(input.receiptAt).toISOString()
    : new Date().toISOString();
  const status = movement.type === 'return' ? 'returned' : 'received';
  const notes = input.notes
    ? [movement.notes, String(input.notes).trim()].filter(Boolean).join(' ')
    : movement.notes;

  await movementRef.set(
    {
      receiptAt,
      receiptByUid: actor.uid,
      status,
      notes
    },
    { merge: true }
  );

  const pendingApprovals = await fileRef
    .collection('approvals')
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  const fileStatus =
    movement.type === 'return'
      ? 'open'
      : pendingApprovals.empty
        ? 'open'
        : 'pending_approval';

  await fileRef.set(
    {
      currentHolderUid: movement.toUid,
      currentHolderName: movement.toName,
      currentDepartmentId: movement.toDepartmentId || null,
      pendingMovementId: null,
      lastMovementAt: receiptAt,
      status: fileStatus,
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );
  await writeAudit({
    actor,
    action: 'movement.received',
    entityType: 'file',
    entityId: fileId,
    details: `${actor.displayName} confirmed receipt of ${file.reference}.`
  });

  return { ...movement, receiptAt, receiptByUid: actor.uid, status, notes };
}

async function createApproval(fileId, input = {}, user) {
  const db = getFirebaseFirestore();
  const actor = await getActorProfile(user);
  const fileRef = db.collection('files').doc(fileId);
  const snapshot = await fileRef.get();

  if (!snapshot.exists) {
    throw httpError(404, 'File not found.');
  }

  const file = toFile(snapshot);
  if (!['admin', 'crc', 'manager'].includes(actor.role)) {
    throw httpError(403, 'You cannot add approval steps for this file.');
  }
  if (['completed', 'cancelled'].includes(file.status)) {
    throw httpError(400, 'Completed or cancelled files cannot receive new approvals.');
  }

  const title = String(input.title || '').trim();
  const assignedRole = String(input.assignedRole || '').trim();

  if (!title) {
    throw httpError(400, 'Approval title is required.');
  }
  if (!VALID_ROLES.includes(assignedRole) || assignedRole === 'admin') {
    throw httpError(400, 'Select a valid approval role.');
  }

  const existing = await fileRef.collection('approvals').get();
  const approval = {
    fileId,
    title,
    assignedRole,
    assignedUid: String(input.assignedUid || ''),
    sequence: existing.size + 1,
    status: 'pending',
    actionAt: null,
    actionByUid: null,
    actionByName: null,
    comment: '',
    createdAt: new Date().toISOString()
  };

  const ref = await fileRef.collection('approvals').add(approval);

  if (file.status !== 'completed' && file.status !== 'cancelled') {
    await fileRef.set(
      { status: 'pending_approval', updatedAt: new Date().toISOString() },
      { merge: true }
    );
  }

  await writeAudit({
    actor,
    action: 'approval.created',
    entityType: 'file',
    entityId: fileId,
    details: `Added approval step "${title}" to ${file.reference}.`
  });

  const lookups = await loadLookups(db);
  return decorateApproval(
    { id: ref.id, ...approval },
    decorateFile({ ...file, status: 'pending_approval' }, lookups),
    lookups
  );
}

async function updateApproval(fileId, approvalId, input = {}, user) {
  const db = getFirebaseFirestore();
  const actor = await getActorProfile(user);
  const fileRef = db.collection('files').doc(fileId);
  const approvalRef = fileRef.collection('approvals').doc(approvalId);
  const [fileSnapshot, approvalSnapshot] = await Promise.all([fileRef.get(), approvalRef.get()]);

  if (!fileSnapshot.exists || !approvalSnapshot.exists) {
    throw httpError(404, 'Approval step not found.');
  }

  const file = toFile(fileSnapshot);
  const approval = toApproval(approvalSnapshot);

  if (approval.status !== 'pending') {
    throw httpError(400, 'This approval step has already been actioned.');
  }

  const allowed =
    actor.role === 'admin' ||
    approval.assignedUid === actor.uid ||
    approval.assignedRole === actor.role;

  if (!allowed) {
    throw httpError(403, 'This approval step is assigned to another role.');
  }
  if (!['approved', 'returned', 'skipped'].includes(input.status)) {
    throw httpError(400, 'Select a valid approval action.');
  }
  if (input.status === 'returned' && !String(input.comment || '').trim()) {
    throw httpError(400, 'Add a reason when returning a file.');
  }

  const now = new Date().toISOString();
  const updates = {
    status: input.status,
    actionAt: now,
    actionByUid: actor.uid,
    actionByName: actor.displayName,
    comment: String(input.comment || '').trim()
  };

  await approvalRef.set(updates, { merge: true });

  if (file.status !== 'completed' && file.status !== 'cancelled') {
    const pending = await fileRef
      .collection('approvals')
      .where('status', '==', 'pending')
      .limit(200)
      .get();
    const hasOtherPending = pending.docs.some((doc) => doc.id !== approvalId);
    await fileRef.set(
      { status: hasOtherPending ? 'pending_approval' : 'open', updatedAt: now },
      { merge: true }
    );
  }

  await writeAudit({
    actor,
    action: `approval.${input.status}`,
    entityType: 'file',
    entityId: fileId,
    details: `${actor.displayName} marked "${approval.title}" as ${input.status} for ${file.reference}.`
  });

  const lookups = await loadLookups(db);
  return decorateApproval(
    { ...approval, ...updates, id: approvalId },
    decorateFile(file, lookups),
    lookups
  );
}

module.exports = {
  ACTIVE_STATUSES,
  getUserProfile,
  listFiles,
  getFile,
  createFile,
  updateFile,
  completeFile,
  listMovements,
  createMovement,
  receiveMovement,
  createApproval,
  updateApproval
};
