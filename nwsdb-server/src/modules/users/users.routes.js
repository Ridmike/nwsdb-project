const express = require('express');
const controller = require('./users.controller');
const { authenticate, requireAdmin } = require('../../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/directory', controller.listDirectory);

router.use(requireAdmin);

router.get('/', controller.listUsers);
router.post('/', controller.createUser);
router.patch('/:uid', controller.updateUser);
router.post('/:uid/reset-password', controller.resetPassword);

module.exports = router;
