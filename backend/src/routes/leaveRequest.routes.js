const express = require('express');
const authenticateUser = require('../middleware/authenticateUser');
const requireCompleteProfile = require('../middleware/requireCompleteProfile');
const { getMyLeaveRequests } = require('../controllers/leaveRequestController');

const router = express.Router();

router.use(authenticateUser, requireCompleteProfile);

// GET /api/v1/leave-requests/my
router.get('/my', getMyLeaveRequests);

module.exports = router;