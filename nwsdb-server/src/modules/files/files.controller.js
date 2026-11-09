const service = require('./files.service');

async function list(req, res, next) {
  try {
    const data = await service.listFiles(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function get(req, res, next) {
  try {
    const data = await service.getFile(req.params.fileId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const data = await service.createFile(req.body, req.user);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const data = await service.updateFile(req.params.fileId, req.body, req.user);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function complete(req, res, next) {
  try {
    const data = await service.completeFile(req.params.fileId, req.user);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function listMovements(req, res, next) {
  try {
    const data = await service.listMovements(req.params.fileId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function createMovement(req, res, next) {
  try {
    const data = await service.createMovement(req.params.fileId, req.body, req.user);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function receiveMovement(req, res, next) {
  try {
    const data = await service.receiveMovement(
      req.params.fileId,
      req.params.movementId,
      req.body,
      req.user
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function createApproval(req, res, next) {
  try {
    const data = await service.createApproval(req.params.fileId, req.body, req.user);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function updateApproval(req, res, next) {
  try {
    const data = await service.updateApproval(
      req.params.fileId,
      req.params.approvalId,
      req.body,
      req.user
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  get,
  create,
  update,
  complete,
  listMovements,
  createMovement,
  receiveMovement,
  createApproval,
  updateApproval
};
