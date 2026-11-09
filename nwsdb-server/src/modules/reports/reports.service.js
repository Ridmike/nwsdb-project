const { getFirebaseFirestore } = require('../../config/firebase');
const { DAY, loadLookups, decorateFile, departmentName } = require('../../utils/data');

async function getReportSummary() {
  const db = getFirebaseFirestore();

  const [fileSnapshot, movementSnapshot, auditSnapshot, lookups] = await Promise.all([
    db.collection('files').orderBy('registeredAt', 'desc').limit(1000).get(),
    db.collectionGroup('movements').limit(5000).get(),
    db.collection('audit').orderBy('createdAt', 'desc').limit(12).get(),
    loadLookups(db)
  ]);

  const files = fileSnapshot.docs.map((doc) =>
    decorateFile({ id: doc.id, ...doc.data() }, lookups)
  );
  const fileById = new Map(files.map((file) => [file.id, file]));

  const movementsByFile = new Map();
  for (const doc of movementSnapshot.docs) {
    const movement = { id: doc.id, ...doc.data() };
    const fileId = movement.fileId || doc.ref.parent.parent.id;
    if (!movementsByFile.has(fileId)) {
      movementsByFile.set(fileId, []);
    }
    movementsByFile.get(fileId).push({ ...movement, fileId });
  }

  const transitDurations = [];
  const stageMap = new Map();
  const inTransit = [];

  for (const [fileId, movements] of movementsByFile.entries()) {
    const file = fileById.get(fileId);
    if (!file) {
      continue;
    }

    const sorted = movements
      .slice()
      .sort(
        (left, right) =>
          new Date(left.handoverAt).getTime() - new Date(right.handoverAt).getTime()
      );

    for (let index = 0; index < sorted.length; index += 1) {
      const movement = sorted[index];
      const handover = new Date(movement.handoverAt).getTime();

      if (movement.receiptAt) {
        const receipt = new Date(movement.receiptAt).getTime();
        transitDurations.push(Math.max(0, receipt - handover));

        const nextHandover = sorted[index + 1]?.handoverAt
          ? new Date(sorted[index + 1].handoverAt).getTime()
          : file.completedAt
            ? new Date(file.completedAt).getTime()
            : Date.now();
        const held = Math.max(0, nextHandover - receipt);
        const department = departmentName(lookups, movement.toDepartmentId) || 'Unassigned';
        const current = stageMap.get(department) || { total: 0, count: 0 };
        current.total += held;
        current.count += 1;
        stageMap.set(department, current);
      } else {
        inTransit.push({
          ...movement,
          fileReference: file.reference,
          consumerName: file.consumerName,
          daysInTransit: Math.max(0, Math.floor((Date.now() - handover) / DAY)),
          fromDepartmentName: departmentName(lookups, movement.fromDepartmentId),
          toDepartmentName: departmentName(lookups, movement.toDepartmentId)
        });
      }
    }
  }

  const statusCounts = [
    'open',
    'pending_receipt',
    'pending_approval',
    'completed',
    'cancelled'
  ].map((status) => ({
    status,
    count: files.filter((file) => file.status === status).length
  }));

  const categoryMap = new Map();
  for (const file of files) {
    const name = file.categoryName || 'Uncategorised';
    categoryMap.set(name, (categoryMap.get(name) || 0) + 1);
  }

  const holderMap = new Map();
  for (const file of files.filter((item) =>
    ['open', 'pending_receipt', 'pending_approval'].includes(item.status)
  )) {
    const name = file.currentHolderName || 'Unassigned';
    const entry = holderMap.get(name) || { name, count: 0, overdue: 0 };
    entry.count += 1;
    if (file.overdue) {
      entry.overdue += 1;
    }
    holderMap.set(name, entry);
  }

  const monthlyMap = new Map();
  for (const file of files) {
    const date = new Date(file.registeredAt);
    if (Number.isNaN(date.getTime())) {
      continue;
    }
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
  }

  const delayedFiles = files
    .filter((file) => file.overdue)
    .map((file) => ({
      ...file,
      daysOverdue: Math.max(
        0,
        Math.floor((Date.now() - new Date(file.dueDate).getTime()) / DAY)
      )
    }))
    .sort((left, right) => right.daysOverdue - left.daysOverdue);

  const averageTransit = transitDurations.length
    ? transitDurations.reduce((total, value) => total + value, 0) /
      transitDurations.length
    : 0;

  return {
    statusCounts,
    categoryCounts: Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => right.count - left.count),
    holderCounts: Array.from(holderMap.values()).sort(
      (left, right) => right.count - left.count
    ),
    monthlyRegistrations: Array.from(monthlyMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((left, right) => left.month.localeCompare(right.month))
      .slice(-6),
    stageAverages: Array.from(stageMap.entries())
      .map(([name, value]) => ({
        name,
        averageMs: Math.round(value.total / value.count),
        count: value.count
      }))
      .sort((left, right) => right.averageMs - left.averageMs),
    averageTransitMs: Math.round(averageTransit),
    inTransit: inTransit.sort(
      (left, right) => right.daysInTransit - left.daysInTransit
    ),
    delayedFiles,
    recentAudit: auditSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  };
}

module.exports = { getReportSummary };
