const express = require('express');
const controller = require('./approvals.controller');
const { authenticate } = require('../../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.get('/', controller.list);

module.exports = router;
