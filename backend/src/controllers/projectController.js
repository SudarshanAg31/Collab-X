const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Project = require('../models/Project');
const Membership = require('../models/Membership');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { CATEGORY_VALUES } = require('../config/constants');
const { getMatchesForUser } = require('../services/matching.service');

function handleValidation(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw ApiError.badRequest(
      'VALIDATION_ERROR',
      'Request validation failed',
      errors.array({ onlyFirstError: true })
    );
  }
}

// POST /api/v1/projects
// POST /api/v1/projects — enforces 2-active-project limit (owner counts as member)
const MAX_ACTIVE_PROJECTS_PER_USER = 2;
const createProject = asyncHandler(async (req, res) => {
  handleValidation(req);

  const {
    title,
    description,
    summary = '',
    category,
    techStack = [],
    githubRepoUrl,
    requiredMembers,
    experienceLevel,
  } = req.body;

  const session = await mongoose.startSession();
  let createdProject = null;

  try {
    await session.withTransaction(async () => {
      // 1. Serialize concurrent project creations by this owner.
      const guard = await mongoose.connection
        .collection('users')
        .findOneAndUpdate(
          { _id: req.user._id },
          { $inc: { projectGuardVersion: 1 } },
          { session, returnDocument: 'after' }
        );
      const guardDoc = guard?.value ?? guard;
      if (!guardDoc) throw ApiError.notFound('USER_NOT_FOUND', 'User not found');

      // 2. Count active memberships INSIDE the transaction.
      const activeCount = await Membership.countDocuments({
        user: req.user._id,
        status: 'active',
      }).session(session);

      if (activeCount >= MAX_ACTIVE_PROJECTS_PER_USER) {
        throw ApiError.conflict(
          'PROJECT_LIMIT_REACHED',
          `You can participate in at most ${MAX_ACTIVE_PROJECTS_PER_USER} active projects`
        );
      }

      // 3. Create project + owner membership atomically.
      const [project] = await Project.create(
        [
          {
            title,
            description,
            summary,
            category,
            techStack,
            githubRepoUrl,
            requiredMembers,
            experienceLevel,
            owner: req.user._id,
          },
        ],
        { session }
      );

      await Membership.create(
        [
          {
            user: req.user._id,
            project: project._id,
            role: 'owner',
            status: 'active',
            githubInviteStatus: 'not_applicable', // owner already has repo access
          },
        ],
        { session }
      );

      createdProject = project;
    });
  } finally {
    await session.endSession();
  }

  res.status(201).json({
    success: true,
    data: { project: createdProject.toJSONSafe() },
  });
});

// GET /api/v1/projects
// Filters: ?category=web&experienceLevel=beginner&status=open&q=search
const listProjects = asyncHandler(async (req, res) => {
  const { category, experienceLevel, status, q } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (experienceLevel) filter.experienceLevel = experienceLevel;
  if (status) filter.status = status;
  if (q && String(q).trim()) {
    const rx = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: rx }, { summary: rx }];
  }

  const projects = await Project.find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('owner', 'username githubUsername profile.fullName');

  res.json({
    success: true,
    data: {
      count: projects.length,
      projects: projects.map((p) => ({
        ...p.toJSONSafe(),
        owner: p.owner
          ? {
              id: p.owner._id,
              username: p.owner.username,
              githubUsername: p.owner.githubUsername,
              fullName: p.owner.profile?.fullName || '',
            }
          : null,
      })),
    },
  });
});

// GET /api/v1/projects/match/me  (placeholder — Module 5 fills in)
const matchMyProjects = asyncHandler(async (req, res) => {
  const matches = await getMatchesForUser(req.user, { limit: 20 });
  res.json({ success: true, data: { count: matches.length, matches } });
});

// GET /api/v1/projects/:id
const getProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('INVALID_ID', 'Invalid project id');
  }

  const project = await Project.findById(id).populate(
    'owner',
    'username githubUsername profile.fullName profile.experienceLevel'
  );
  if (!project) throw ApiError.notFound('PROJECT_NOT_FOUND', 'Project not found');

  const members = await Membership.find({ project: project._id, status: 'active' }).populate(
    'user',
    'username githubUsername profile.fullName'
  );

  res.json({
    success: true,
    data: {
      project: project.toJSONSafe(),
      team: members.map((m) => ({
        role: m.role,
        joinedAt: m.joinedAt,
        user: m.user
          ? {
              id: m.user._id,
              username: m.user.username,
              githubUsername: m.user.githubUsername,
              fullName: m.user.profile?.fullName || '',
            }
          : null,
      })),
    },
  });
});

// PATCH /api/v1/projects/:id  (owner only — enforced by isProjectAdmin)
const updateProject = asyncHandler(async (req, res) => {
  handleValidation(req);

  const project = req.project;
  const previousStatus = project.status;

  const allowed = [
    'title',
    'description',
    'summary',
    'category',
    'techStack',
    'githubRepoUrl',
    'requiredMembers',
    'experienceLevel',
    'status',
  ];

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      project[key] = req.body[key];
    }
  }

  await project.save();

  // Cascade — when a project leaves the active lifecycle,
  // free up every member's 2-active-project slot.
  const closingStatuses = ['archived', 'completed'];
  const wasClosing = !closingStatuses.includes(previousStatus) && closingStatuses.includes(project.status);

  if (wasClosing) {
    await Membership.updateMany(
      { project: project._id, status: 'active' },
      { $set: { status: 'inactive' } }
    );
  }

  res.json({ success: true, data: { project: project.toJSONSafe() } });
});

// DELETE /api/v1/projects/:id  (owner only)
const deleteProject = asyncHandler(async (req, res) => {
  const project = req.project; // from isProjectAdmin

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Membership.deleteMany({ project: project._id }, { session });
      await Project.deleteOne({ _id: project._id }, { session });
    });
  } finally {
    await session.endSession();
  }

  res.json({ success: true, data: { deleted: true, id: project._id } });
});
module.exports = {
  createProject,
  listProjects,
  matchMyProjects,
  getProject,
  updateProject,
  deleteProject,
  _categoryValuesForFrontend: CATEGORY_VALUES, // (unused; helps IDE)
};