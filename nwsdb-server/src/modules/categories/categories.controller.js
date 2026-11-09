const service = require('./categories.service');
const { actorFromRequest } = require('../../utils/actor');

async function list(req, res, next) {
  try {
    const data = await service.listCategories();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const data = await service.createCategory(req.body, actorFromRequest(req.user));
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const data = await service.updateCategory(req.params.id, req.body, actorFromRequest(req.user));
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = { list, create, update };
