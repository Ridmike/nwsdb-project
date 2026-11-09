const express = require('express');
const usersRoutes = require('../modules/users/users.routes');
const departmentRoutes = require('../modules/departments/departments.routes');
const categoryRoutes = require('../modules/categories/categories.routes');
const fileRoutes = require('../modules/files/files.routes');
const approvalRoutes = require('../modules/approvals/approvals.routes');
const dashboardRoutes = require('../modules/dashboard/dashboard.routes');
const reportRoutes = require('../modules/reports/reports.routes');

const router = express.Router();

router.use('/users', usersRoutes);
router.use('/departments', departmentRoutes);
router.use('/error-categories', categoryRoutes);
router.use('/files', fileRoutes);
router.use('/approvals', approvalRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
