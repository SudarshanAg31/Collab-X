const express = require('express');
const { body, query } = require('express-validator');
const authenticateUser = require('../middleware/authenticateUser');
const requireCompleteProfile = require('../middleware/requireCompleteProfile');
const isProjectAdmin = require('../middleware/isProjectAdmin');
const isProjectMember = require('../middleware/isProjectMember');
const canAccessWorkspace = require('../middleware/canAccessWorkspace');
const adminOrReadOnly = require('../middleware/adminOrReadOnly');

const {
  createProject,
  listProjects,
  matchMyProjects,
  getProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { listProjectApplications } = require('../controllers/applicationController');
const { listProjectMembers } = require('../controllers/membershipController');
const { getWorkspace } = require('../controllers/workspaceController');
const {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const {
  listMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
} = require('../controllers/meetingController');
const {
  listNotices,
  createNotice,
  updateNotice,
  deleteNotice,
} = require('../controllers/noticeController');

// Leave Request imports
const {
  submitLeaveRequest,
  listLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
} = require('../controllers/leaveRequestController');

const {
  CATEGORY_VALUES,
  EXPERIENCE_LEVEL_VALUES,
  PROJECT_STATUS_VALUES,
} = require('../config/constants');

const router = express.Router();
router.use(authenticateUser, requireCompleteProfile);

// Static routes FIRST
router.get('/match/me', matchMyProjects);

// Validators
const createValidator = [
  body('title').isString().trim().isLength({ min: 3, max: 120 }),
  body('description').isString().trim().isLength({ min: 10, max: 5000 }),
  body('summary').optional().isString().trim().isLength({ max: 300 }),
  body('category').isString().isIn(CATEGORY_VALUES),
  body('techStack').optional().isArray({ max: 20 }),
  body('techStack.*').optional().isString().trim().isLength({ min: 1, max: 40 }),
  body('githubRepoUrl')
    .isString()
    .matches(/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/)
    .withMessage('githubRepoUrl must be a valid GitHub repo URL'),
  body('requiredMembers').isInt({ min: 1, max: 20 }).toInt(),
  body('experienceLevel').isIn(EXPERIENCE_LEVEL_VALUES),
];

const updateValidator = [
  body('title').optional().isString().trim().isLength({ min: 3, max: 120 }),
  body('description').optional().isString().trim().isLength({ min: 10, max: 5000 }),
  body('summary').optional().isString().trim().isLength({ max: 300 }),
  body('category').optional().isIn(CATEGORY_VALUES),
  body('techStack').optional().isArray({ max: 20 }),
  body('techStack.*').optional().isString().trim().isLength({ min: 1, max: 40 }),
  body('githubRepoUrl')
    .optional()
    .isString()
    .matches(/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/)
    .withMessage('githubRepoUrl must be a valid GitHub repo URL'),
  body('requiredMembers').optional().isInt({ min: 1, max: 20 }).toInt(),
  body('experienceLevel').optional().isIn(EXPERIENCE_LEVEL_VALUES),
  body('status').optional().isIn(PROJECT_STATUS_VALUES),
];

const listValidator = [
  query('category').optional().isIn(CATEGORY_VALUES),
  query('experienceLevel').optional().isIn(EXPERIENCE_LEVEL_VALUES),
  query('status').optional().isIn(PROJECT_STATUS_VALUES),
  query('q').optional().isString().isLength({ max: 80 }),
];

router.post('/', createValidator, createProject);
router.get('/', listValidator, listProjects);

// Dynamic routes
router.get('/:id', getProject);
router.patch('/:id', isProjectAdmin, updateValidator, updateProject);
router.delete('/:id', isProjectAdmin, deleteProject);
router.get('/:id/applications', isProjectAdmin, listProjectApplications);
router.get('/:id/members', isProjectMember, listProjectMembers);
router.get('/:id/workspace', canAccessWorkspace, getWorkspace);

// ── Leave Requests ───────────────────────────────────
// Static route for current user's requests
router.get('/leave-requests/my', require('../controllers/leaveRequestController').getMyLeaveRequests);

// Project-specific leave request routes
router.post('/:id/leave-requests', isProjectMember, submitLeaveRequest);
router.get('/:id/leave-requests', isProjectAdmin, listLeaveRequests);
router.post('/:id/leave-requests/:requestId/approve', isProjectAdmin, approveLeaveRequest);
router.post('/:id/leave-requests/:requestId/reject', isProjectAdmin, rejectLeaveRequest);

// ── Announcements ────────────────────────────────────
router.get('/:id/announcements', canAccessWorkspace, adminOrReadOnly, listAnnouncements);
router.post(
  '/:id/announcements',
  canAccessWorkspace,
  adminOrReadOnly,
  [
    body('title').isString().trim().isLength({ min: 3, max: 120 }),
    body('content').isString().trim().isLength({ min: 1, max: 5000 }),
  ],
  createAnnouncement
);
router.patch(
  '/:id/announcements/:announcementId',
  canAccessWorkspace,
  adminOrReadOnly,
  [
    body('title').optional().isString().trim().isLength({ min: 3, max: 120 }),
    body('content').optional().isString().trim().isLength({ min: 1, max: 5000 }),
  ],
  updateAnnouncement
);
router.delete('/:id/announcements/:announcementId', canAccessWorkspace, adminOrReadOnly, deleteAnnouncement);

// ── Offline meetings ─────────────────────────────────
router.get('/:id/meetings', canAccessWorkspace, adminOrReadOnly, listMeetings);
router.post(
  '/:id/meetings',
  canAccessWorkspace,
  adminOrReadOnly,
  [
    body('meetingDate').isISO8601().withMessage('meetingDate must be ISO8601'),
    body('meetingTime').isString().trim().isLength({ min: 1, max: 10 }),
    body('venue').isString().trim().isLength({ min: 1, max: 200 }),
    body('agenda').isString().trim().isLength({ min: 1, max: 2000 }),
  ],
  createMeeting
);
router.patch(
  '/:id/meetings/:meetingId',
  canAccessWorkspace,
  adminOrReadOnly,
  [
    body('meetingDate').optional().isISO8601(),
    body('meetingTime').optional().isString().trim().isLength({ min: 1, max: 10 }),
    body('venue').optional().isString().trim().isLength({ min: 1, max: 200 }),
    body('agenda').optional().isString().trim().isLength({ min: 1, max: 2000 }),
  ],
  updateMeeting
);
router.delete('/:id/meetings/:meetingId', canAccessWorkspace, adminOrReadOnly, deleteMeeting);

// ── Notice board ─────────────────────────────────────
router.get('/:id/notices', canAccessWorkspace, adminOrReadOnly, listNotices);
router.post(
  '/:id/notices',
  canAccessWorkspace,
  adminOrReadOnly,
  [
    body('title').isString().trim().isLength({ min: 3, max: 120 }),
    body('content').isString().trim().isLength({ min: 1, max: 5000 }),
  ],
  createNotice
);
router.patch(
  '/:id/notices/:noticeId',
  canAccessWorkspace,
  adminOrReadOnly,
  [
    body('title').optional().isString().trim().isLength({ min: 3, max: 120 }),
    body('content').optional().isString().trim().isLength({ min: 1, max: 5000 }),
  ],
  updateNotice
);
router.delete('/:id/notices/:noticeId', canAccessWorkspace, adminOrReadOnly, deleteNotice);

// ── GitHub ───────────────────────────────────────────
router.use('/:id/github', require('./github.routes'));

module.exports = router;