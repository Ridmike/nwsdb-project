const { getFirebaseAuth } = require('../config/firebase');

async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Missing or invalid Authorization header.'
    });
  }

  try {
    const decodedToken = await getFirebaseAuth().verifyIdToken(header.slice(7).trim());
    req.user = decodedToken;
    return next();
  } catch (error) {
    if (error.status === 503) {
      return res.status(503).json({ success: false, message: error.message });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token. Please sign in again.'
    });
  }
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Administrator access is required for this action.'
  });
}

module.exports = { authenticate, requireAdmin };
