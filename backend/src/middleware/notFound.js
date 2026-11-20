const ApiError = require('../utils/ApiError');

module.exports = (req, _res, next) => {
  next(ApiError.notFound('ROUTE_NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
};