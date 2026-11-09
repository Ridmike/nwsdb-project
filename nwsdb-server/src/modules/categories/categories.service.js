const { getFirebaseFirestore } = require('../../config/firebase');
const { httpError } = require('../../utils/http');
const { writeAudit } = require('../../utils/audit');

function toCategory(doc) {
  return { id: doc.id, ...doc.data() };
}

async function listCategories() {
  const snapshot = await getFirebaseFirestore()
    .collection('errorCategories')
    .orderBy('name')
    .get();
  return snapshot.docs.map(toCategory);
}

async function validateParent(db, parentId, currentId = '') {
  if (!parentId) {
    return null;
  }
  if (parentId === currentId) {
    throw httpError(400, 'A category cannot be its own parent.');
  }
  const parent = await db.collection('errorCategories').doc(parentId).get();
  if (!parent.exists || parent.data().parentId) {
    throw httpError(400, 'Select a valid main category as the parent.');
  }
  return parentId;
}

async function createCategory(input = {}, actor) {
  const db = getFirebaseFirestore();
  const name = String(input.name || '').trim();
  const code = String(input.code || '').trim().toUpperCase();

  if (!name || !code) {
    throw httpError(400, 'Category name and code are required.');
  }

  const existing = await db.collection('errorCategories').where('code', '==', code).limit(1).get();
  if (!existing.empty) {
    throw httpError(409, 'A category with this code already exists.');
  }

  const parentId = await validateParent(db, input.parentId || null);
  const now = new Date().toISOString();
  const record = {
    name,
    code,
    parentId,
    active: input.active !== false,
    createdAt: now,
    updatedAt: now
  };

  const ref = await db.collection('errorCategories').add(record);
  await writeAudit({
    actor,
    action: 'category.created',
    entityType: 'category',
    entityId: ref.id,
    details: `Created error category ${name}.`
  });

  return { id: ref.id, ...record };
}

async function updateCategory(id, input = {}, actor) {
  const db = getFirebaseFirestore();
  const ref = db.collection('errorCategories').doc(id);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw httpError(404, 'Category not found.');
  }

  const current = snapshot.data();
  const updates = {};

  if (input.name !== undefined) {
    const name = String(input.name).trim();
    if (!name) {
      throw httpError(400, 'Category name is required.');
    }
    updates.name = name;
  }

  if (input.code !== undefined) {
    const code = String(input.code).trim().toUpperCase();
    if (!code) {
      throw httpError(400, 'Category code is required.');
    }
    const duplicate = await db.collection('errorCategories').where('code', '==', code).limit(2).get();
    if (duplicate.docs.some((doc) => doc.id !== id)) {
      throw httpError(409, 'A category with this code already exists.');
    }
    updates.code = code;
  }

  if (input.parentId !== undefined) {
    updates.parentId = await validateParent(db, input.parentId || null, id);
  }
  if (input.active !== undefined) {
    updates.active = Boolean(input.active);
  }

  updates.updatedAt = new Date().toISOString();
  await ref.set(updates, { merge: true });
  await writeAudit({
    actor,
    action: 'category.updated',
    entityType: 'category',
    entityId: id,
    details: `Updated error category ${updates.name || current.name}.`
  });

  return { id, ...current, ...updates };
}

module.exports = { listCategories, createCategory, updateCategory };
