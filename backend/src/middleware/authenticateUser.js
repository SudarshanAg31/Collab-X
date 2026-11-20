const User = require('../models/User');
const { verifyToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');

module.exports = async (req, _res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      throw ApiError.unauthorized('MISSING_TOKEN', 'Authorization header with Bearer token required');
    }

    const token = header.slice(7).trim();
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      throw ApiError.unauthorized('INVALID_TOKEN', 'Token is invalid or expired');
    }

    const user = await User.findById(decoded.sub);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('USER_INACTIVE', 'User not found or inactive');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};