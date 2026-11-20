const express = require('express');
const { body } = require('express-validator');
const authenticateUser = require('../middleware/authenticateUser');
const { getMe, getProfile, updateProfile } = require('../controllers/userController');
const {
  submitLeaveRequest,
  listLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
} = require('../controllers/leaveRequestController');

const router = express.Router();

// All /users routes require auth. Profile gate is NOT applied here
// because this is exactly where users complete their profile.
router.use(authenticateUser);

router.get('/me', getMe);
router.get('/profile', getProfile);

router.patch(
  '/profile',
  [
    body('fullName').optional().isString().trim().isLength({ min: 2, max: 80 }),
    body('bio').optional().isString().trim().isLength({ max: 500 }),
    body('experienceLevel').optional().isIn(['beginner', 'intermediate', 'advanced']),
    body('category').optional().isString().trim().isLength({ min: 1, max: 40 }),
    body('skills').optional().isArray({ max: 30 }),
    body('skills.*').optional().isString().trim().isLength({ min: 1, max: 40 }),
    // THE FIX: Add checkFalsy: true
    body('linkedinUrl').optional({ checkFalsy: true }).isURL().withMessage('linkedinUrl must be a valid URL'),
    body('portfolioUrl').optional({ checkFalsy: true }).isURL().withMessage('portfolioUrl must be a valid URL'),
  ],
  updateProfile
);

// Leave Request routes


module.exports = router;