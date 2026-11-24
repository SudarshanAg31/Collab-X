const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Application = require('../models/Application');
const Membership = require('../models/Membership');
const Project = require('../models/Project');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { MAX_ACTIVE_PROJECTS = 2 } = {}; // safe default; overridden in module 6 constants
const MAX_ACTIVE_PROJECTS_PER_USER = MAX_ACTIVE_PROJECTS;

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

async function activeMembershipCount(userId, session = null) {
  const q = Membership.countDocuments({ user: userId, status: 'active' });
  if (session) q.session(session);
  return q;
}

// ─────────────────────────────────────────────────────────────────────────
// POST /api/v1/applications
// Body: { projectId, requestedRole?, message? }
// ─────────────────────────────────────────────────────────────────────────
const submitApplication = asyncHandler(async (req, res) => {
  handleValidation(req);

  // Whitelist body fields
  const { projectId, requestedRole = 'member', message = '' } = req.body;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw ApiError.badRequest('INVALID_ID', 'Invalid projectId');
  }

  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound('PROJECT_NOT_FOUND', 'Project not found');

  // Guard: cannot apply to own project
  if (project.owner.equals(req.user._id)) {
    throw ApiError.badRequest('CANNOT_APPLY_OWN_PROJECT', 'You cannot apply to your own project');
  }

  // Guard: project must be open
  if (project.status !== 'open') {
    throw ApiError.badRequest('PROJECT_NOT_OPEN', 'Project is not open for applications');
  }

  // Guard: already a member
  const existingMembership = await Membership.findOne({
    user: req.user._id,
    project: project._id,
    status: 'active',
  });
  if (existingMembership) {
    throw ApiError.conflict('ALREADY_MEMBER', 'You are already an active member of this project');
  }

  // Guard: 2-active-project limit (pre-check; final check is in approve())
  const activeCount = await activeMembershipCount(req.user._id);
  if (activeCount >= MAX_ACTIVE_PROJECTS_PER_USER) {
    throw ApiError.conflict(
      'PROJECT_LIMIT_REACHED',
      `You can participate in at most ${MAX_ACTIVE_PROJECTS_PER_USER} active projects`
    );
  }

  // Guard: duplicate pending application (DB-level unique partial index also enforces)
  const duplicate = await Application.findOne({
    project: project._id,
    applicant: req.user._id,
    status: 'pending',
  });
  if (duplicate) {
    throw ApiError.conflict('DUPLICATE_APPLICATION', 'You already have a pending application for this project');
  }

  let application;
  try {
    application = await Application.create({
      project: project._id,
      applicant: req.user._id,
      requestedRole: String(requestedRole).slice(0, 40),
      message: String(message).slice(0, 500),
    });
  } catch (err) {
    if (err.code === 11000) {
      throw ApiError.conflict('DUPLICATE_APPLICATION', 'You already have a pending application for this project');
    }
    throw err;
  }

  res.status(201).json({
    success: true,
    data: {
      application: {
        id: application._id,
        project: application.project,
        applicant: application.applicant,
        requestedRole: application.requestedRole,
        message: application.message,
        status: application.status,
        createdAt: application.createdAt,
      },
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/v1/applications/my
// ─────────────────────────────────────────────────────────────────────────
const myApplications = asyncHandler(async (req, res) => {
  const apps = await Application.find({ applicant: req.user._id })
    .sort({ createdAt: -1 })
    .populate('project', 'title category status owner');

  res.json({
    success: true,
    data: {
      count: apps.length,
      applications: apps.map((a) => ({
        id: a._id,
        status: a.status,
        requestedRole: a.requestedRole,
        message: a.message,
        createdAt: a.createdAt,
        reviewedAt: a.reviewedAt,
        project: a.project
          ? { id: a.project._id, title: a.project.title, category: a.project.category, status: a.project.status }
          : null,
      })),
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/v1/projects/:id/applications  (owner only — route-level isProjectAdmin)
// ─────────────────────────────────────────────────────────────────────────
const listProjectApplications = asyncHandler(async (req, res) => {
  // req.project set by isProjectAdmin
  const apps = await Application.find({ project: req.project._id })
    .sort({ createdAt: -1 })
    .populate('applicant', 'username githubUsername profile.fullName profile.experienceLevel profile.skills');

  res.json({
    success: true,
    data: {
      count: apps.length,
      applications: apps.map((a) => ({
        id: a._id,
        status: a.status,
        requestedRole: a.requestedRole,
        message: a.message,
        createdAt: a.createdAt,
        reviewedAt: a.reviewedAt,
        applicant: a.applicant
          ? {
              id: a.applicant._id,
              username: a.applicant.username,
              githubUsername: a.applicant.githubUsername,
              fullName: a.applicant.profile?.fullName || '',
              experienceLevel: a.applicant.profile?.experienceLevel || null,
              skills: a.applicant.profile?.skills || [],
            }
          : null,
      })),
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/v1/applications/:id/approve   — TRANSACTIONAL + 2-limit safe
// ─────────────────────────────────────────────────────────────────────────

const approveApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('INVALID_ID', 'Invalid application id');
  }

  const application = await Application.findById(id);
  if (!application) throw ApiError.notFound('APPLICATION_NOT_FOUND', 'Application not found');

  // Ownership is re-verified from DB (correction #7).
  const project = await Project.findById(application.project);
  if (!project) throw ApiError.notFound('PROJECT_NOT_FOUND', 'Project not found');
  if (!project.owner.equals(req.user._id)) {
    throw ApiError.forbidden('NOT_PROJECT_ADMIN', 'Only the project owner can approve applications');
  }

  // Block approval if the project is no longer accepting members.
  if (!['open', 'in_progress'].includes(project.status)) {
    throw ApiError.badRequest('PROJECT_NOT_ACTIVE', 'Project is not accepting new members');
  }

  if (application.status !== 'pending') {
    throw ApiError.conflict('ALREADY_PROCESSED', `Application already ${application.status}`);
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(
      async () => {
        // 1. Serialize concurrent approvals for this applicant.
        const applicantGuard = await mongoose.connection
          .collection('users')
          .findOneAndUpdate(
            { _id: application.applicant },
            { $inc: { projectGuardVersion: 1 } },
            { session, returnDocument: 'after' }
          );

        // Driver v5+ returns the doc directly; older versions return { value }.
        const applicantDoc = applicantGuard?.value ?? applicantGuard;

        if (!applicantDoc) {
          throw ApiError.notFound('USER_NOT_FOUND', 'Applicant no longer exists');
        }

        // 2. Count active memberships INSIDE the transaction.
        const activeCount = await Membership.countDocuments({
          user: application.applicant,
          status: 'active',
        }).session(session);

        if (activeCount >= MAX_ACTIVE_PROJECTS_PER_USER) {
          throw ApiError.conflict(
            'PROJECT_LIMIT_REACHED',
            `Applicant already participates in ${MAX_ACTIVE_PROJECTS_PER_USER} active projects`
          );
        }

        // 3. Flip application pending → accepted atomically.
        const freshApp = await Application.findOneAndUpdate(
          { _id: application._id, status: 'pending' },
          { $set: { status: 'accepted', reviewedBy: req.user._id, reviewedAt: new Date() } },
          { session, new: true }
        );
        if (!freshApp) {
          throw ApiError.conflict('ALREADY_PROCESSED', 'Application was processed by another request');
        }

        // 4. Create membership.
        try {
          await Membership.create(
            [
              {
                user: application.applicant,
                project: application.project,
                role: 'member',
                status: 'active',
                githubInviteStatus: 'pending',
              },
            ],
            { session }
          );
        } catch (err) {
          if (err.code === 11000) {
            throw ApiError.conflict('ALREADY_MEMBER', 'Applicant is already an active member');
          }
          throw err;
        }
      },
      {
        readPreference: 'primary',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' },
      }
    );
  } finally {
    await session.endSession();
  }
  // Membership is already active; invite is a separate state.
  try {
    const { sendInvite } = require('../services/githubInvite.service');
    const Membership = require('../models/Membership');
    Membership.findOne({
      user: application.applicant,
      project: project._id,
      role: 'member',
      status: 'active',
    }).then((m) => {
      if (m) {
        sendInvite({ project, membership: m }).catch((err) => {
          console.error('[invite] post-approval invite failed:', err.message);
        });
      }
    }).catch(() => {});
  } catch (err) {
    console.error('[invite] dispatch failed:', err.message);
  }
  res.json({
    success: true,
    data: { approved: true, applicationId: application._id },
  });
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/v1/applications/:id/reject
// ─────────────────────────────────────────────────────────────────────────
const rejectApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('INVALID_ID', 'Invalid application id');
  }

  const application = await Application.findById(id);
  if (!application) throw ApiError.notFound('APPLICATION_NOT_FOUND', 'Application not found');

  const project = await Project.findById(application.project);
  if (!project) throw ApiError.notFound('PROJECT_NOT_FOUND', 'Project not found');
  if (!project.owner.equals(req.user._id)) {
    throw ApiError.forbidden('NOT_PROJECT_ADMIN', 'Only the project owner can reject applications');
  }

  if (application.status !== 'pending') {
    throw ApiError.conflict('ALREADY_PROCESSED', `Application already ${application.status}`);
  }

  const updated = await Application.findOneAndUpdate(
    { _id: application._id, status: 'pending' },
    { $set: { status: 'rejected', reviewedBy: req.user._id, reviewedAt: new Date() } },
    { new: true }
  );
  if (!updated) {
    throw ApiError.conflict('ALREADY_PROCESSED', 'Application was processed by another request');
  }

  res.json({ success: true, data: { rejected: true, applicationId: updated._id } });
});

module.exports = {
  submitApplication,
  myApplications,
  listProjectApplications,
  approveApplication,
  rejectApplication,
};