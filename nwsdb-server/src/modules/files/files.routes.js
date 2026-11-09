const express = require('express');
const controller = require('./files.controller');
const { authenticate } = require('../../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', controller.list);
router.post('/', controller.create);

router.get('/:fileId', controller.get);
router.patch('/:fileId', controller.update);
router.post('/:fileId/complete', controller.complete);

router.get('/:fileId/movements', controller.listMovements);
router.post('/:fileId/movements', controller.createMovement);
router.post('/:fileId/movements/:movementId/receive', controller.receiveMovement);

router.post('/:fileId/approvals', controller.createApproval);
router.patch('/:fileId/approvals/:approvalId', controller.updateApproval);

module.exports = router;
