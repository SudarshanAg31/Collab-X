const express = require('express');
const authenticateUser = require('../middleware/authenticateUser');
const requireCompleteProfile = require('../middleware/requireCompleteProfile');
const { myMemberships } = require('../controllers/membershipController');

const router = express.Router();
router.use(authenticateUser, requireCompleteProfile);

router.get('/my', myMemberships);

module.exports = router;