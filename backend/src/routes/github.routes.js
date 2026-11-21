const express = require('express');
const canAccessWorkspace = require('../middleware/canAccessWorkspace');
const requireProjectOwnerGithub = require('../middleware/requireProjectOwnerGithub');
const adminOrReadOnly = require('../middleware/adminOrReadOnly');
const {
  getRepository,
  getTree,
  getReadme,
  getCommits,
  inviteMember,
  retryInvites,
} = require('../controllers/githubController');

const router = express.Router({ mergeParams: true });

// All routes require workspace access + owner's token.
router.use(canAccessWorkspace, requireProjectOwnerGithub);

// Read endpoints (members + owner).
router.get('/repository', getRepository);
router.get('/tree', getTree);
router.get('/readme', getReadme);
router.get('/commits', getCommits);

// Admin-only writes.
router.post('/invite', adminOrReadOnly, inviteMember);
router.post('/invite/retry', adminOrReadOnly, retryInvites);

module.exports = router;