const Project = require('../models/Project');
const Membership = require('../models/Membership');

function normalise(arr) {
  return new Set((arr || []).map((s) => String(s).trim().toLowerCase()).filter(Boolean));
}

// Score a single project against a user.
// Returns { score, categoryMatch, techOverlap, skillOverlap, memberSlotsLeft }
function scoreProject(project, user) {
  const userSkills = normalise(user.profile?.skills);
  const userTech = userSkills; // user skills double as "technologies" for overlap
  const projTech = normalise(project.techStack);

  const techOverlap = [...projTech].filter((t) => userTech.has(t)).length;
  const skillOverlap = [...userSkills].filter((s) => projTech.has(s)).length;

  const categoryMatch = user.profile?.category === project.category ? 1 : 0;

  const techScore = projTech.size ? techOverlap / projTech.size : 0;
  const skillScore = userSkills.size ? skillOverlap / userSkills.size : 0;

  const score = 0.6 * techScore + 0.3 * skillScore + 0.1 * categoryMatch;

  return {
    score: Number(score.toFixed(4)),
    categoryMatch,
    techOverlap,
    skillOverlap,
    memberSlotsLeft: Math.max(0, (project.requiredMembers || 0) - (project._activeMembers || 0)),
  };
}

/**
 * Fetch top matching projects for a user.
 * Excludes:
 *  - projects the user already belongs to (active membership)
 *  - projects the user owns
 *  - projects that are not 'open'
 *  - projects the user has a pending application to
 */
async function getMatchesForUser(user, { limit = 20 } = {}) {
  // Projects the user is already in (owner or member)
  const myMemberships = await Membership.find({ user: user._id, status: 'active' }).select('project');
  const excludedIds = new Set(myMemberships.map((m) => m.project.toString()));

  const candidates = await Project.find({
    status: 'open',
    owner: { $ne: user._id },
    _id: { $nin: [...excludedIds] },
  })
    .limit(200)
    .populate('owner', 'username githubUsername profile.fullName');

  // Pull active member counts in one query
  const projIds = candidates.map((p) => p._id);
  const counts = await Membership.aggregate([
    { $match: { project: { $in: projIds }, status: 'active' } },
    { $group: { _id: '$project', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

  const scored = candidates
    .map((p) => {
      const activeMembers = countMap.get(p._id.toString()) || 0;
      const memberSlotsLeft = Math.max(0, (p.requiredMembers || 0) - activeMembers);
      const base = scoreProject({ ...p.toObject(), _activeMembers: activeMembers }, user);
      return { project: p, ...base, activeMembers };
    })
    .filter((r) => r.memberSlotsLeft > 0) // only projects with open slots
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((r) => ({
    project: {
      ...r.project.toJSONSafe(),
      owner: r.project.owner
        ? {
            id: r.project.owner._id,
            username: r.project.owner.username,
            githubUsername: r.project.owner.githubUsername,
            fullName: r.project.owner.profile?.fullName || '',
          }
        : null,
    },
    score: r.score,
    reasons: {
      categoryMatch: Boolean(r.categoryMatch),
      techOverlap: r.techOverlap,
      skillOverlap: r.skillOverlap,
      activeMembers: r.activeMembers,
      memberSlotsLeft: r.memberSlotsLeft,
    },
  }));
}

module.exports = { getMatchesForUser, scoreProject };