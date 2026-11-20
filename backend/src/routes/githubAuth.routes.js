const express = require('express');
const authenticateUser = require('../middleware/authenticateUser');
const requireCompleteProfile = require('../middleware/requireCompleteProfile');
const {
  getOAuthUrl,
  oauthCallback,
  getGithubStatus,
} = require('../controllers/githubAuthController');

const router = express.Router();

// Authenticated + profile-complete required to start OAuth
router.get('/url', authenticateUser, requireCompleteProfile, getOAuthUrl);

// Callback is PUBLIC (the browser hits it with ?code&state; the state binds it to a user)
router.get('/callback', oauthCallback);

// Status of the CURRENT user
router.get('/status', authenticateUser, getGithubStatus);

module.exports = router;