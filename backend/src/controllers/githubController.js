const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { parseGithubRepoUrl } = require('../utils/githubUrlParser');
const github = require('../services/github.service');

function ownerRepoFromProject(project) {
  try {
    return parseGithubRepoUrl(project.githubRepoUrl);
  } catch (err) {
    throw ApiError.badRequest('INVALID_GITHUB_REPO_URL', err.message);
  }
}

// GET /api/v1/projects/:id/github/repository
const getRepository = asyncHandler(async (req, res) => {
  const { owner, repo } = ownerRepoFromProject(req.project);
  const token = await github.getOwnerToken(req.project.owner);

  const repository = await github.getRepository(owner, repo, token);
  res.json({ success: true, data: { repository, fetchedAt: new Date().toISOString() } });
});

// GET /api/v1/projects/:id/github/tree
const getTree = asyncHandler(async (req, res) => {
  const { owner, repo } = ownerRepoFromProject(req.project);
  const token = await github.getOwnerToken(req.project.owner);

  const result = await github.getFullTree(owner, repo, token);
  res.json({ success: true, data: result });
});

// GET /api/v1/projects/:id/github/readme
const getReadme = asyncHandler(async (req, res) => {
  const { owner, repo } = ownerRepoFromProject(req.project);
  const token = await github.getOwnerToken(req.project.owner);

  const readme = await github.getReadme(owner, repo, token);
  res.json({
    success: true,
    data: { readme, fetchedAt: new Date().toISOString() },
  });
});

// GET /api/v1/projects/:id/github/commits?page=1&limit=30
const getCommits = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const perPage = Math.min(100, Math.max(1, Number(req.query.limit) || 30));

  const { owner, repo } = ownerRepoFromProject(req.project);
  const token = await github.getOwnerToken(req.project.owner);

  const repoInfo = await github.getRepository(owner, repo, token);
  if (!repoInfo.defaultBranch) {
    throw ApiError.badRequest('GITHUB_NO_BRANCH', 'Repository has no default branch');
  }

  const commits = await github.getCommits(owner, repo, repoInfo.defaultBranch, token, {
    page,
    perPage,
  });

  res.json({
    success: true,
    data: { ...commits, branch: repoInfo.defaultBranch, fetchedAt: new Date().toISOString() },
  });
});
const Membership = require('../models/Membership');
const { sendInvite, retryFailedInvites } = require('../services/githubInvite.service');

// POST /api/v1/projects/:id/github/invite
// Body: { membershipId }
const inviteMember = asyncHandler(async (req, res) => {
  const { membershipId } = req.body;
  if (!membershipId) {
    throw ApiError.badRequest('MISSING_MEMBERSHIP_ID', 'membershipId is required');
  }
  if (!require('mongoose').Types.ObjectId.isValid(membershipId)) {
    throw ApiError.badRequest('INVALID_ID', 'Invalid membershipId');
  }

  const membership = await Membership.findOne({
    _id: membershipId,
    project: req.project._id,
  });
  if (!membership) {
    throw ApiError.notFound('MEMBERSHIP_NOT_FOUND', 'Membership not found for this project');
  }

  const status = await sendInvite({ project: req.project, membership });

  res.json({
    success: true,
    data: {
      membershipId: membership._id,
      githubInviteStatus: membership.githubInviteStatus,
      githubInviteAttempts: membership.githubInviteAttempts,
      githubInviteLastError: membership.githubInviteLastError,
      githubInviteUpdatedAt: membership.githubInviteUpdatedAt,
    },
  });
});

// POST /api/v1/projects/:id/github/invite/retry
// Retries all failed/pending invites for the project.
const retryInvites = asyncHandler(async (req, res) => {
  const results = await retryFailedInvites({ project: req.project });
  res.json({
    success: true,
    data: {
      retried: results.length,
      results,
    },
  });
});

module.exports = { getRepository, getTree, getReadme, getCommits, inviteMember, retryInvites };