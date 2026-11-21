/**
 * Parse a validated `project.githubRepoUrl` into { owner, repo }.
 * Never accept owner/repo from the request body — always derive from this.
 *
 * Accepted:  https://github.com/owner/repo
 *            https://github.com/owner/repo.git
 *            https://github.com/owner/repo/
 * Rejected:  any non-github.com host, missing owner/repo, extra path segments.
 */
function parseGithubRepoUrl(url) {
  if (typeof url !== 'string' || !url) {
    throw new Error('Invalid GitHub repository URL');
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Invalid GitHub repository URL');
  }

  if (parsed.protocol !== 'https:' || parsed.hostname.toLowerCase() !== 'github.com') {
    throw new Error('GitHub repository URL must be https://github.com/...');
  }

  const parts = parsed.pathname.replace(/^\/+|\/+$/g, '').split('/');
  if (parts.length !== 2) {
    throw new Error('GitHub repository URL must be https://github.com/{owner}/{repo}');
  }

  let [owner, repo] = parts;
  if (repo.endsWith('.git')) repo = repo.slice(0, -4);

  if (!owner || !repo) {
    throw new Error('GitHub repository URL must include owner and repo');
  }

  // GitHub owner/repo rules: alphanumerics, hyphens, underscores, dots.
  const validOwner = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(owner);
  const validRepo = /^[A-Za-z0-9._-]{1,100}$/.test(repo);

  if (!validOwner || !validRepo) {
    throw new Error('GitHub repository URL contains invalid owner or repo name');
  }

  return { owner, repo };
}

module.exports = { parseGithubRepoUrl };