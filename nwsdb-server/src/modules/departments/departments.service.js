const { getFirebaseFirestore } = require('../../config/firebase');
const { httpError } = require('../../utils/http');
const { writeAudit } = require('../../utils/audit');

const TYPES = ['division', 'section', 'office', 'unit'];

function toDepartment(doc) {
  return { id: doc.id, ...doc.data() };
}

async function listDepartments() {
  const snapshot = await getFirebaseFirestore().collection('departments').orderBy('name').get();
  return snapshot.docs.map(toDepartment);
}

async function createDepartment(input = {}, actor) {
  const db = getFirebaseFirestore();
  const name = String(input.name || '').trim();
  const code = String(input.code || '').trim().toUpperCase();
  const type = TYPES.includes(input.type) ? input.type : 'section';

  if (!name || !code) {
    throw httpError(400, 'Department name and code are required.');
  }

  const existing = await db.collection('departments').where('code', '==', code).limit(1).get();
  if (!existing.empty) {
    throw httpError(409, 'A department with this code already exists.');
  }

  const now = new Date().toISOString();
  const record = {
    name,
    code,
    type,
    parentId: input.parentId || null,
    active: input.active !== false,
    createdAt: now,
    updatedAt: now
  };

  const ref = await db.collection('departments').add(record);
  await writeAudit({
    actor,
    action: 'department.created',
    entityType: 'department',
    entityId: ref.id,
    details: `Created department ${name}.`
  });

  return { id: ref.id, ...record };
}

async function updateDepartment(id, input = {}, actor) {
  const db = getFirebaseFirestore();
  const ref = db.collection('departments').doc(id);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw httpError(404, 'Department not found.');
  }

  const current = snapshot.data();
  const updates = {};

  if (input.name !== undefined) {
    const name = String(input.name).trim();
    if (!name) {
      throw httpError(400, 'Department name is required.');
    }
    updates.name = name;
  }

  if (input.code !== undefined) {
    const code = String(input.code).trim().toUpperCase();
    if (!code) {
      throw httpError(400, 'Department code is required.');
    }
    const duplicate = await db.collection('departments').where('code', '==', code).limit(2).get();
    if (duplicate.docs.some((doc) => doc.id !== id)) {
      throw httpError(409, 'A department with this code already exists.');
    }
    updates.code = code;
  }

  if (input.type !== undefined) {
    updates.type = TYPES.includes(input.type) ? input.type : current.type || 'section';
  }
  if (input.parentId !== undefined) {
    updates.parentId = input.parentId || null;
  }
  if (input.active !== undefined) {
    updates.active = Boolean(input.active);
  }

  updates.updatedAt = new Date().toISOString();
  await ref.set(updates, { merge: true });
  await writeAudit({
    actor,
    action: 'department.updated',
    entityType: 'department',
    entityId: id,
    details: `Updated department ${updates.name || current.name}.`
  });

  return { id, ...current, ...updates };
}

module.exports = { TYPES, listDepartments, createDepartment, updateDepartment };
