const service = require('./approvals.service');

async function list(req, res, next) {
  try {
    const data = await service.listApprovals(req.query, req.user);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = { list };
