const express = require('express');
const { body } = require('express-validator');
const authenticateUser = require('../middleware/authenticateUser');
const requireCompleteProfile = require('../middleware/requireCompleteProfile');
const {
  submitApplication,
  myApplications,
  approveApplication,
  rejectApplication,
} = require('../controllers/applicationController');

const router = express.Router();

router.use(authenticateUser, requireCompleteProfile);

router.post(
  '/',
  [
    body('projectId').isString().isLength({ min: 1 }),
    body('requestedRole').optional().isString().trim().isLength({ max: 40 }),
    body('message').optional().isString().trim().isLength({ max: 500 }),
  ],
  submitApplication
);

router.get('/my', myApplications);
router.post('/:id/approve', approveApplication);
router.post('/:id/reject', rejectApplication);

module.exports = router;