const express = require('express');
const controller = require('./reports.controller');
const { authenticate } = require('../../middleware/auth');

const router = express.Router();

function requireReportingAccess(req, res, next) {
  if (['admin', 'manager', 'rsc'].includes(req.user?.role)) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Reports are available to administrators, managers, and RSC officers.'
  });
}

router.use(authenticate, requireReportingAccess);
router.get('/summary', controller.summary);

module.exports = router;
