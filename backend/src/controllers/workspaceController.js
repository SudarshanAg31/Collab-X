const Membership = require('../models/Membership');
const Application = require('../models/Application');
const Announcement = require('../models/Announcement');
const OfflineMeeting = require('../models/OfflineMeeting');
const Notice = require('../models/Notice');
const asyncHandler = require('../utils/asyncHandler');

const getWorkspace = asyncHandler(async (req, res) => {
  const project = req.project;

  const [members, pendingApplications, announcements, meetings, notices] = await Promise.all([
    Membership.find({ project: project._id, status: 'active' })
      .sort({ role: 1, joinedAt: 1 })
      .populate('user', 'username githubUsername profile.fullName profile.experienceLevel profile.skills'),
    Application.countDocuments({ project: project._id, status: 'pending' }),
    Announcement.countDocuments({ project: project._id }),
    OfflineMeeting.countDocuments({ project: project._id }),
    Notice.countDocuments({ project: project._id }),
  ]);

  res.json({
    success: true,
    data: {
      project: project.toJSONSafe(),
      membership: req.membership
        ? {
            id: req.membership._id,
            role: req.membership.role,
            status: req.membership.status,
            joinedAt: req.membership.joinedAt,
            githubInviteStatus: req.membership.githubInviteStatus,
          }
        : null,
      team: {
        activeCount: members.length,
        slotsTotal: project.requiredMembers,
        members: members.map((m) => ({
          membershipId: m._id,
          role: m.role,
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
      counts: {
        pendingApplications,
        announcements,
        meetings,
        notices, // ← now real
      },
      github: {
        repoUrl: project.githubRepoUrl || null,
        repoConnected: false,
      },
    },
  });
});

module.exports = { getWorkspace };