const service = require('./dashboard.service');

async function summary(req, res, next) {
  try {
    const data = await service.getDashboardSummary(req.user);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = { summary };
