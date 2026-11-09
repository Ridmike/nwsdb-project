const service = require('./reports.service');

async function summary(req, res, next) {
  try {
    const data = await service.getReportSummary();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = { summary };
