const ApiError = require('../utils/ApiError');

/**
 * Must be mounted AFTER a middleware that sets req.project
 * (canAccessWorkspace or isProjectAdmin).
 *
 * Allows:
 *   - GET / HEAD / OPTIONS: any req.user with workspace access
 *   - POST / PATCH / PUT / DELETE: only project owner
 */
module.exports = (req, _res, next) => {
  const method = req.method.toUpperCase();
  const isRead = ['GET', 'HEAD', 'OPTIONS'].includes(method);

  if (isRead) return next();

  if (!req.project) {
    return next(ApiError.internal('adminOrReadOnly requires req.project'));
  }

  if (!req.project.owner.equals(req.user._id)) {
    return next(
      ApiError.forbidden('NOT_PROJECT_ADMIN', 'Only the project owner can perform this action')
    );
  }

  next();
};