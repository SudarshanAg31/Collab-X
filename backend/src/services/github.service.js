const User = require('../models/User');
const { decrypt } = require('./crypto.service');
const ApiError = require('../utils/ApiError');

const API_BASE = 'https://api.github.com';
const USER_AGENT = 'CollabX-Backend/1.0';

/**
 * Load + decrypt the owner's GitHub token.
 * Throws GITHUB_NOT_CONNECTED if the owner hasn't authorized yet.
 */
async function getOwnerToken(userId) {
  const user = await User.findById(userId).select(
    '+githubOAuth.accessTokenEnc +githubOAuth.iv +githubOAuth.authTag'
  );
  if (!user || !user.githubOAuth?.accessTokenEnc) {
    throw ApiError.badRequest(
      'GITHUB_NOT_CONNECTED',
      'The project owner has not connected their GitHub account'
    );
  }
  return decrypt({
    ciphertext: user.githubOAuth.accessTokenEnc,
    iv: user.githubOAuth.iv,
    authTag: user.githubOAuth.authTag,
  });
}

/**
 * Low-level fetch wrapper.
 * - Adds Authorization, User-Agent, Accept headers
 * - Maps GitHub errors to our ApiError codes
 * - Never leaks the token in any error message
 */
async function callGitHub(path, { token, method = 'GET', body = null } = {}) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': USER_AGENT,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  let resp;
  try {
    resp = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    // network failure, DNS, timeout
    throw ApiError.badRequest(
      'GITHUB_UNAVAILABLE',
      'GitHub API is unreachable. Try again in a moment.'
    );
  }

  if (resp.ok) {
    // 204 No Content
    if (resp.status === 204) return { status: 204, data: null, headers: resp.headers };
    const data = await resp.json();
    return { status: resp.status, data, headers: resp.headers };
  }

  // ── Error mapping ────────────────────────────────────
  const rateLimited =
    resp.status === 403 && resp.headers.get('x-ratelimit-remaining') === '0';
  const bodyText = await resp.text().catch(() => '');

  if (rateLimited) {
    const reset = resp.headers.get('x-ratelimit-reset');
    const msg = reset
      ? `GitHub rate limit reached. Try again after ${new Date(Number(reset) * 1000).toISOString()}`
      : 'GitHub rate limit reached. Try again later.';
    throw ApiError.badRequest('GITHUB_RATE_LIMITED', msg);
  }
  if (resp.status === 401) {
    throw ApiError.badRequest(
      'GITHUB_TOKEN_INVALID',
      'GitHub rejected the stored token. The owner needs to reconnect.'
    );
  }
  if (resp.status === 403) {
    throw ApiError.badRequest(
      'GITHUB_PERMISSION_DENIED',
      'GitHub denied access. The owner may lack admin rights on this repository.'
    );
  }
  if (resp.status === 404) {
    throw ApiError.notFound('GITHUB_NOT_FOUND', 'GitHub resource not found');
  }
  if (resp.status >= 500) {
    throw ApiError.badRequest('GITHUB_UNAVAILABLE', 'GitHub API is currently unavailable');
  }

  // Fallback
  throw ApiError.badRequest(
    'GITHUB_API_ERROR',
    `GitHub returned ${resp.status}${bodyText ? `: ${bodyText.slice(0, 200)}` : ''}`
  );
}

// ─────────────────────────────────────────────────────────
// High-level helpers
// ─────────────────────────────────────────────────────────

async function getRepository(owner, repo, token) {
  const { data } = await callGitHub(`/repos/${owner}/${repo}`, { token });
  return {
    id: data.id,
    name: data.name,
    fullName: data.full_name,
    description: data.description,
    owner: {
      login: data.owner?.login || '',
      avatarUrl: data.owner?.avatar_url || '',
      htmlUrl: data.owner?.html_url || '',
    },
    defaultBranch: data.default_branch,
    visibility: data.visibility || (data.private ? 'private' : 'public'),
    htmlUrl: data.html_url,
    updatedAt: data.updated_at,
    pushedAt: data.pushed_at,
    stars: data.stargazers_count,
    forks: data.forks_count,
    language: data.language,
    permissions: data.permissions || null, // present only with owner token
  };
}

async function getLatestCommitSha(owner, repo, branch, token) {
  const { data } = await callGitHub(`/repos/${owner}/${repo}/commits/${branch}`, { token });
  return { commitSha: data.sha, treeSha: data.commit.tree.sha };
}

async function getTreeRecursive(owner, repo, treeSha, token) {
  const { data } = await callGitHub(
    `/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`,
    { token }
  );
  return { tree: data.tree || [], truncated: Boolean(data.truncated) };
}

async function getContents(owner, repo, path, token) {
  const { data } = await callGitHub(`/repos/${owner}/${repo}/contents/${path}`, { token });
  return data;
}

async function getReadme(owner, repo, token) {
  try {
    const { data } = await callGitHub(`/repos/${owner}/${repo}/readme`, { token });
    return {
      name: data.name,
      path: data.path,
      htmlUrl: data.html_url,
      content: Buffer.from(data.content, 'base64').toString('utf8'),
      truncated: data.content ? false : true,
    };
  } catch (err) {
    if (err.code === 'GITHUB_NOT_FOUND') {
      return { name: null, path: null, htmlUrl: null, content: null, truncated: false };
    }
    throw err;
  }
}

async function getCommits(owner, repo, branch, token, { page = 1, perPage = 30 } = {}) {
  const { data, headers } = await callGitHub(
    `/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(branch)}&per_page=${perPage}&page=${page}`,
    { token }
  );
  const linkHeader = headers.get('link') || '';
  const hasMore = /rel="next"/.test(linkHeader);

  return {
    commits: data.map((c) => ({
      sha: c.sha,
      shortSha: c.sha.slice(0, 7),
      message: c.commit.message,
      authorName: c.commit.author?.name || '',
      authorLogin: c.author?.login || null,
      authorAvatarUrl: c.author?.avatar_url || null,
      date: c.commit.author?.date || null,
      htmlUrl: c.html_url,
    })),
    hasMore,
    page,
    perPage,
  };
}

/**
 * Fetch the full nested tree, working around GitHub's truncation on large repos.
 * If truncated, walk top-level dirs by SHA and merge.
 */
async function getFullTree(owner, repo, token) {
  const repoInfo = await getRepository(owner, repo, token);
  const branch = repoInfo.defaultBranch;
  if (!branch) {
    throw ApiError.badRequest('GITHUB_NO_BRANCH', 'Repository has no default branch (empty repo?)');
  }

  const { commitSha, treeSha } = await getLatestCommitSha(owner, repo, branch, token);

  const root = await getTreeRecursive(owner, repo, treeSha, token);
  let entries = root.tree;
  let wasTruncated = root.truncated;
  let fetchFailed = false;

  if (wasTruncated) {
    // Walk top-level directories individually.
    const topDirs = entries.filter((e) => e.type === 'tree' && !e.path.includes('/'));
    const merged = new Map(entries.map((e) => [e.path, e]));

    for (const dir of topDirs) {
      try {
        const sub = await getTreeRecursive(owner, repo, dir.sha, token);
        for (const item of sub.tree) {
          const fullPath = `${dir.path}/${item.path}`;
          if (!merged.has(fullPath)) {
            merged.set(fullPath, { ...item, path: fullPath });
          }
        }
        if (sub.truncated) {
          // one level deeper — fetch immediate children trees individually
          const nestedDirs = sub.tree.filter((e) => e.type === 'tree');
          for (const nd of nestedDirs) {
            try {
              const sub2 = await getTreeRecursive(owner, repo, nd.sha, token);
              for (const item of sub2.tree) {
                const fullPath = `${dir.path}/${nd.path}/${item.path}`;
                if (!merged.has(fullPath)) {
                  merged.set(fullPath, { ...item, path: fullPath });
                }
              }
            } catch {
              fetchFailed = true;
            }
          }
        }
      } catch {
        fetchFailed = true;
      }
    }

    entries = [...merged.values()];
  }

  return {
    branch,
    headSha: commitSha,
    treeSha,
    tree: entries,
    truncated: fetchFailed, // true only if our fallback couldn't finish
    totalEntries: entries.length,
    fetchedAt: new Date().toISOString(),
  };
}

module.exports = {
  getOwnerToken,
  callGitHub,
  getRepository,
  getLatestCommitSha,
  getTreeRecursive,
  getContents,
  getReadme,
  getCommits,
  getFullTree,
};