const ApiError = require('../utils/ApiError');

module.exports = (req, _res, next) => {
  if (!req.user || !req.user.isProfileComplete) {
    return next(
      ApiError.forbidden(
        'PROFILE_INCOMPLETE',
        'Complete your profile before using this feature'
      )
    );
  }
  next();
};