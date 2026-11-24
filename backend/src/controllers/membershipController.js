const Membership = require('../models/Membership');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/v1/memberships/my
const myMemberships = asyncHandler(async (req, res) => {
  const memberships = await Membership.find({ user: req.user._id, status: 'active' })
    .sort({ joinedAt: -1 })
    .populate('project', 'title category status requiredMembers experienceLevel owner');

  res.json({
    success: true,
    data: {
      count: memberships.length,
      memberships: memberships.map((m) => ({
        id: m._id,
        role: m.role,
        status: m.status,
        joinedAt: m.joinedAt,
        githubInviteStatus: m.githubInviteStatus,
        project: m.project
          ? {
              id: m.project._id,
              title: m.project.title,
              category: m.project.category,
              status: m.project.status,
              requiredMembers: m.project.requiredMembers,
              experienceLevel: m.project.experienceLevel,
              owner: m.project.owner,
            }
          : null,
      })),
    },
  });
});

// GET /api/v1/projects/:id/members   (uses req.project from isProjectMember)
const listProjectMembers = asyncHandler(async (req, res) => {
  const members = await Membership.find({ project: req.project._id, status: 'active' })
    .sort({ role: 1, joinedAt: 1 }) // owners first, then chronological
    .populate('user', 'username githubUsername profile.fullName profile.experienceLevel profile.skills');

  res.json({
    success: true,
    data: {
      count: members.length,
      members: members.map((m) => ({
        membershipId: m._id,
        role: m.role,
        status: m.status,
        joinedAt: m.joinedAt,
        githubInviteStatus: m.githubInviteStatus,
        user: m.user
          ? {
              id: m.user._id,
              username: m.user.username,
              githubUsername: m.user.githubUsername,
              fullName: m.user.profile?.fullName || '',
              experienceLevel: m.user.profile?.experienceLevel || null,
              skills: m.user.profile?.skills || [],
            }
          : null,
      })),
    },
  });
});

module.exports = { myMemberships, listProjectMembers };