const User = require('../models/User');
const ApiError = require('../utils/ApiError');

/**
 * Requires req.project.owner to have GitHub OAuth connected.
 * Must be mounted AFTER canAccessWorkspace (which sets req.project).
 */
module.exports = async (req, _res, next) => {
  try {
    if (!req.project) {
      return next(ApiError.internal('requireProjectOwnerGithub requires req.project'));
    }

    const owner = await User.findById(req.project.owner).select(
      '+githubOAuth.accessTokenEnc'
    );
    if (!owner || !owner.githubOAuth?.accessTokenEnc) {
      return next(
        ApiError.badRequest(
          'GITHUB_NOT_CONNECTED',
          'The project owner has not connected their GitHub account yet'
        )
      );
    }
    next();
  } catch (err) {
    next(err);
  }
};