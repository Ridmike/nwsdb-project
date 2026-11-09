const DAY = 86400000;

function toDate(value) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function departmentName(lookups, id) {
  return lookups.departments.find((department) => department.id === id)?.name || '';
}

function departmentBySection(lookups, section) {
  return (
    lookups.departments.find(
      (department) => department.name.toLowerCase() === String(section || '').toLowerCase()
    ) || null
  );
}

function categoryName(lookups, id) {
  return lookups.categories.find((category) => category.id === id)?.name || '';
}

async function loadLookups(db) {
  const [departmentSnapshot, categorySnapshot] = await Promise.all([
    db.collection('departments').get(),
    db.collection('errorCategories').get()
  ]);

  return {
    departments: departmentSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((left, right) => String(left.name).localeCompare(String(right.name))),
    categories: categorySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((left, right) => String(left.name).localeCompare(String(right.name)))
  };
}

function decorateFile(file, lookups) {
  const category = lookups.categories.find((item) => item.id === file.categoryId);
  const subCategory = lookups.categories.find((item) => item.id === file.subCategoryId);
  const dueDate = toDate(file.dueDate);
  const completedAt = toDate(file.completedAt);
  const registeredAt = toDate(file.registeredAt);
  const overdue =
    Boolean(dueDate) &&
    dueDate.getTime() < Date.now() &&
    !['completed', 'cancelled'].includes(file.status);
  const endDate = completedAt || new Date();

  return {
    ...file,
    categoryName: category?.name || 'Uncategorised',
    subCategoryName: subCategory?.name || '',
    currentDepartmentName: departmentName(lookups, file.currentDepartmentId),
    overdue,
    ageDays: registeredAt
      ? Math.max(0, Math.floor((endDate.getTime() - registeredAt.getTime()) / DAY))
      : 0
  };
}

function decorateApproval(approval, file, lookups) {
  return {
    ...approval,
    fileReference: file?.reference || '',
    fileStatus: file?.status || '',
    consumerName: file?.consumerName || '',
    currentHolderName: file?.currentHolderName || '',
    currentDepartmentName: file
      ? departmentName(lookups, file.currentDepartmentId)
      : ''
  };
}

module.exports = {
  DAY,
  toDate,
  departmentName,
  departmentBySection,
  categoryName,
  loadLookups,
  decorateFile,
  decorateApproval
};
