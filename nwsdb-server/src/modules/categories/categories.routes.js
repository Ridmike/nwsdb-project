const express = require('express');
const controller = require('./categories.controller');
const { authenticate, requireAdmin } = require('../../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', controller.list);
router.post('/', requireAdmin, controller.create);
router.patch('/:id', requireAdmin, controller.update);

module.exports = router;
