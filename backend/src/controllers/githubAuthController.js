const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const {
  issueOAuthState,
  consumeOAuthState,
  exchangeCodeForToken,
  persistToken,
} = require('../services/githubOAuth.service');

// GET /api/v1/auth/github/url
const getOAuthUrl = asyncHandler(async (req, res) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_OAUTH_CALLBACK) {
    throw ApiError.badRequest(
      'GITHUB_OAUTH_NOT_CONFIGURED',
      'GitHub OAuth is not configured on the server'
    );
  }
  const { state, authorizeUrl } = await issueOAuthState(req.user._id);
  res.json({
    success: true,
    data: { url: authorizeUrl, state, expiresInSeconds: 600 },
  });
});

// GET /api/v1/auth/github/callback?code=...&state=...
// This is hit by the BROWSER (redirect from GitHub), not by React.
const oauthCallback = asyncHandler(async (req, res) => {
  const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';

  const { code, state, error: ghError } = req.query;

  // User denied on GitHub's screen
  if (ghError) {
    return res.redirect(`${frontend}/?github=error&reason=access_denied`);
  }
  if (!code || !state) {
    return res.redirect(`${frontend}/?github=error&reason=missing_params`);
  }

  // 1. Verify + consume state atomically (single-use, 10 min TTL)
  const userId = await consumeOAuthState(String(state));
  if (!userId) {
    return res.redirect(`${frontend}/?github=error&reason=state_invalid`);
  }

  // 2. Exchange code for token
  let tokenBundle;
  try {
    tokenBundle = await exchangeCodeForToken(String(code));
  } catch (err) {
    return res.redirect(`${frontend}/?github=error&reason=exchange_failed`);
  }

  // 3. Encrypt + persist
  await persistToken(userId, tokenBundle);

  // 4. Redirect to frontend
  return res.redirect(`${frontend}/?github=connected`);
});

// GET /api/v1/auth/github/status  (own status)
const getGithubStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    '+githubOAuth.accessTokenEnc'
  );
  const connected = Boolean(user?.githubOAuth?.accessTokenEnc);
  res.json({
    success: true,
    data: {
      connected,
      githubLogin: user?.githubOAuth?.githubLogin || '',
      scopes: user?.githubOAuth?.scopes || [],
      obtainedAt: user?.githubOAuth?.obtainedAt || null,
    },
  });
});

module.exports = { getOAuthUrl, oauthCallback, getGithubStatus };