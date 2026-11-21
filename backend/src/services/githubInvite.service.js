const User = require('../models/User');
const Membership = require('../models/Membership');
const github = require('./github.service');
const { parseGithubRepoUrl } = require('../utils/githubUrlParser');

/**
 * Attempt to send a GitHub collaborator invitation for a single membership.
 * Never throws — invite failures are stored on the membership, not propagated.
 *
 * Returns the final invite status.
 */
async function sendInvite({ project, membership }) {
  // Idempotent — if already sent, don't spam GitHub.
  if (membership.githubInviteStatus === 'sent') {
    return membership.githubInviteStatus;
  }

  // Owners don't need invites (they already have the repo).
  if (membership.role === 'owner') {
    membership.githubInviteStatus = 'not_applicable';
    await membership.save();
    return membership.githubInviteStatus;
  }

  // Need the member's GitHub username.
  const member = await User.findById(membership.user).select('githubUsername');
  if (!member || !member.githubUsername) {
    membership.githubInviteStatus = 'failed';
    membership.githubInviteAttempts = (membership.githubInviteAttempts || 0) + 1;
    membership.githubInviteLastError = 'member_missing_github_username';
    membership.githubInviteUpdatedAt = new Date();
    await membership.save();
    return membership.githubInviteStatus;
  }

  // Owner token required.
  let ownerToken;
  try {
    ownerToken = await github.getOwnerToken(project.owner);
  } catch (err) {
    membership.githubInviteStatus = 'failed';
    membership.githubInviteAttempts = (membership.githubInviteAttempts || 0) + 1;
    membership.githubInviteLastError = err.code || 'owner_github_not_connected';
    membership.githubInviteUpdatedAt = new Date();
    await membership.save();
    return membership.githubInviteStatus;
  }

  // Parse repo from project.
  let owner, repo;
  try {
    ({ owner, repo } = parseGithubRepoUrl(project.githubRepoUrl));
  } catch {
    membership.githubInviteStatus = 'failed';
    membership.githubInviteAttempts = (membership.githubInviteAttempts || 0) + 1;
    membership.githubInviteLastError = 'invalid_github_repo_url';
    membership.githubInviteUpdatedAt = new Date();
    await membership.save();
    return membership.githubInviteStatus;
  }

  // Confirm the member exists on GitHub.
  try {
    await github.callGitHub(`/users/${encodeURIComponent(member.githubUsername)}`, {
      token: ownerToken,
    });
  } catch (err) {
    membership.githubInviteStatus = 'failed';
    membership.githubInviteAttempts = (membership.githubInviteAttempts || 0) + 1;
    membership.githubInviteLastError =
      err.code === 'GITHUB_NOT_FOUND'
        ? 'github_user_not_found'
        : err.code || 'github_user_lookup_failed';
    membership.githubInviteUpdatedAt = new Date();
    await membership.save();
    return membership.githubInviteStatus;
  }

  // Send the invite.
  membership.githubInviteStatus = 'retrying';
  membership.githubInviteAttempts = (membership.githubInviteAttempts || 0) + 1;
  await membership.save();

  try {
    const { status } = await github.callGitHub(
      `/repos/${owner}/${repo}/collaborators/${encodeURIComponent(member.githubUsername)}`,
      {
        token: ownerToken,
        method: 'PUT',
        body: { permission: 'push' },
      }
    );

    // 201 = invitation created; 204 = already a collaborator. Both are success.
    if (status === 201 || status === 204) {
      membership.githubInviteStatus = 'sent';
      membership.githubInviteLastError = '';
    } else {
      membership.githubInviteStatus = 'failed';
      membership.githubInviteLastError = `unexpected_status_${status}`;
    }
  } catch (err) {
    membership.githubInviteStatus = 'failed';
    membership.githubInviteLastError = err.code || 'github_invite_failed';
  }

  membership.githubInviteUpdatedAt = new Date();
  await membership.save();
  return membership.githubInviteStatus;
}

/**
 * Retry all failed/pending invites for a project.
 * Returns array of { membershipId, githubInviteStatus, githubInviteLastError }.
 */
async function retryFailedInvites({ project }) {
  const candidates = await Membership.find({
    project: project._id,
    status: 'active',
    role: 'member',
    githubInviteStatus: { $in: ['failed', 'pending', 'retrying'] },
  });

  const results = [];
  for (const m of candidates) {
    const status = await sendInvite({ project, membership: m });
    results.push({
      membershipId: m._id,
      githubInviteStatus: status,
      githubInviteLastError: m.githubInviteLastError || '',
    });
  }
  return results;
}

module.exports = { sendInvite, retryFailedInvites };