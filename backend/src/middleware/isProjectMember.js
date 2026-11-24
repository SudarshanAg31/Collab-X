const mongoose = require('mongoose');
const Membership = require('../models/Membership');
const Project = require('../models/Project');
const ApiError = require('../utils/ApiError');

/**
 * Loads project from :id, sets req.project.
 * Requires req.user to have an ACTIVE Membership on the project.
 * (Owners have an active membership from Module 4, so owners pass automatically.)
 */
module.exports = async (req, _res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('INVALID_ID', 'Invalid project id');
    }

    const project = await Project.findById(id);
    if (!project) throw ApiError.notFound('PROJECT_NOT_FOUND', 'Project not found');

    const membership = await Membership.findOne({
      user: req.user._id,
      project: project._id,
      status: 'active',
    });

    if (!membership) {
      throw ApiError.forbidden('NOT_PROJECT_MEMBER', 'You are not an active member of this project');
    }

    req.project = project;
    req.membership = membership;
    next();
  } catch (err) {
    next(err);
  }
};