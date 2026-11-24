const mongoose = require('mongoose');
const Project = require('../models/Project');
const ApiError = require('../utils/ApiError');

// Loads project from :id and verifies req.user is the owner.
// On success: req.project is set, next() called.
module.exports = async (req, _res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('INVALID_ID', 'Invalid project id');
    }

    const project = await Project.findById(id);
    if (!project) throw ApiError.notFound('PROJECT_NOT_FOUND', 'Project not found');

    // Ownership is checked against the DB — never trust body/query.
    if (!project.owner.equals(req.user._id)) {
      throw ApiError.forbidden('NOT_PROJECT_ADMIN', 'Only the project owner can perform this action');
    }

    req.project = project;
    next();
  } catch (err) {
    next(err);
  }
};