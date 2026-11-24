const mongoose = require('mongoose');
const Project = require('../models/Project');
const Membership = require('../models/Membership');
const ApiError = require('../utils/ApiError');

/**
 * Loads project from :id into req.project.
 * Grants access if EITHER:
 *   - req.user is the project owner, OR
 *   - req.user has an ACTIVE membership on the project.
 * This is the gate for all workspace-related read/write endpoints.
 */
module.exports = async (req, _res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('INVALID_ID', 'Invalid project id');
    }

    const project = await Project.findById(id);
    if (!project) throw ApiError.notFound('PROJECT_NOT_FOUND', 'Project not found');

    // Owner always passes.
    if (project.owner.equals(req.user._id)) {
      const ownerMembership = await Membership.findOne({
        user: req.user._id,
        project: project._id,
      });
      req.project = project;
      req.membership = ownerMembership || null;
      return next();
    }

    // Non-owner must have an ACTIVE membership.
    const membership = await Membership.findOne({
      user: req.user._id,
      project: project._id,
      status: 'active',
    });
    if (!membership) {
      throw ApiError.forbidden('NOT_WORKSPACE_MEMBER', 'You do not have access to this workspace');
    }

    req.project = project;
    req.membership = membership;
    next();
  } catch (err) {
    next(err);
  }
};