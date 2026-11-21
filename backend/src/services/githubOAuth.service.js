const OAuthState = require('../models/OAuthState');
const { generateOAuthState } = require('./crypto.service');
const User = require('../models/User');
const { encrypt } = require('./crypto.service');
const ApiError = require('../utils/ApiError');

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const GITHUB_SCOPES = ['repo']; // private repos + collaborator invites

/**
 * Issue a fresh OAuth state for the given user.
 * Returns { state, authorizeUrl }.
 */
async function issueOAuthState(userId) {
  const state = generateOAuthState();
  const expiresAt = new Date(Date.now() + STATE_TTL_MS);

  await OAuthState.create({
    state,
    userId,
    purpose: 'github_oauth',
    expiresAt,
  });

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_OAUTH_CALLBACK,
    scope: GITHUB_SCOPES.join(' '),
    state,
    allow_signup: 'true',
  });

  return {
    state,
    authorizeUrl: `https://github.com/login/oauth/authorize?${params.toString()}`,
  };
}

/**
 * Verify + atomically consume a state. Returns the userId bound to it,
 * or null if the state is invalid/expired/already consumed.
 */
async function consumeOAuthState(state) {
  if (typeof state !== 'string' || !/^[0-9a-f]{64}$/i.test(state)) return null;

  const now = new Date();
  const doc = await OAuthState.findOneAndUpdate(
    { state, consumedAt: null, expiresAt: { $gt: now } },
    { $set: { consumedAt: now } },
    { new: true }
  );

  return doc ? doc.userId : null;
}

async function exchangeCodeForToken(code) {
  if (!code) throw ApiError.badRequest('OAUTH_MISSING_CODE', 'No authorization code supplied');

  let resp;
  try {
    resp = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_OAUTH_CALLBACK,
      }),
    });
  } catch {
    throw ApiError.badRequest('OAUTH_EXCHANGE_FAILED', 'Unable to reach GitHub to exchange code');
  }

  const data = await resp.json().catch(() => ({}));

  if (data.error) {
    if (data.error === 'bad_verification_code' || data.error === 'incorrect_client_credentials') {
      throw ApiError.badRequest('OAUTH_EXCHANGE_FAILED', 'Authorization code was rejected by GitHub');
    }
    if (data.error === 'access_denied') {
      throw ApiError.badRequest('OAUTH_ACCESS_DENIED', 'You denied the GitHub authorization');
    }
    throw ApiError.badRequest('OAUTH_EXCHANGE_FAILED', data.error_description || data.error);
  }

  if (!data.access_token) {
    throw ApiError.badRequest('OAUTH_EXCHANGE_FAILED', 'GitHub did not return an access token');
  }

  // Identify the GitHub user (also validates the token)
  let ghUser;
  try {
    const userResp = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'CollabX-Backend/1.0',
      },
    });
    if (!userResp.ok) {
      throw ApiError.badRequest(
        'OAUTH_EXCHANGE_FAILED',
        'GitHub token could not be used to identify the user'
      );
    }
    ghUser = await userResp.json();
  } catch (err) {
    if (err.code) throw err;
    throw ApiError.badRequest('OAUTH_EXCHANGE_FAILED', 'Failed to verify GitHub user');
  }

  const scopes = (data.scope || '').split(/[, ]+/).filter(Boolean);

  return {
    accessToken: data.access_token,
    scopes,
    githubLogin: ghUser.login,
  };
}

/**
 * Encrypt token and persist on the user document.
 */
async function persistToken(userId, { accessToken, scopes, githubLogin }) {
  const enc = encrypt(accessToken);
  await User.updateOne(
    { _id: userId },
    {
      $set: {
        'githubOAuth.accessTokenEnc': enc.ciphertext,
        'githubOAuth.iv': enc.iv,
        'githubOAuth.authTag': enc.authTag,
        'githubOAuth.scopes': scopes,
        'githubOAuth.githubLogin': githubLogin,
        'githubOAuth.obtainedAt': new Date(),
      },
    }
  );
}

module.exports = {
  issueOAuthState,
  consumeOAuthState,
  STATE_TTL_MS,
  GITHUB_SCOPES,
  exchangeCodeForToken,
  persistToken,
};
