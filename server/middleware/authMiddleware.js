const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({ message: 'JWT_SECRET is not configured' });
    }

    req.user = jwt.verify(token, secret);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function getUserRole(req) {
  return String(
    req.user?.role ||
    req.user?.userRole ||
    req.user?.type ||
    req.user?.accountType ||
    ''
  ).toLowerCase();
}

function requireRole(allowedRoles) {
  const normalizedAllowedRoles = Array.isArray(allowedRoles)
    ? allowedRoles.map((role) => String(role).toLowerCase())
    : [String(allowedRoles).toLowerCase()];

  return function roleGuard(req, res, next) {
    const userRole = getUserRole(req);

    if (!userRole) {
      return res.status(403).json({ message: 'Forbidden: user role is missing' });
    }

    if (!normalizedAllowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }

    return next();
  };
}

module.exports = {
  authenticateToken,
  getUserRole,
  requireRole,
};