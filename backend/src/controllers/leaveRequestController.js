const mongoose = require('mongoose');
const LeaveRequest = require('../models/LeaveRequest');
const Membership = require('../models/Membership');
const Project = require('../models/Project');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/v1/projects/:id/leave-requests  (Member requests to leave)
const submitLeaveRequest = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason) throw ApiError.badRequest('MISSING_REASON', 'Please provide a reason for leaving');

  const projectId = req.params.id;
  
  // Cannot leave if you are the owner
  if (req.project.owner.equals(req.user._id)) {
    throw ApiError.badRequest('OWNER_CANNOT_LEAVE', 'Owners cannot leave their own project. You can delete it instead.');
  }

  // Check if membership exists and is active
  const membership = await Membership.findOne({
    user: req.user._id,
    project: projectId,
    status: 'active',
  });
  if (!membership) throw ApiError.badRequest('NOT_A_MEMBER', 'You are not an active member of this project');

  // Check for existing pending request
  const existing = await LeaveRequest.findOne({
    project: projectId,
    user: req.user._id,
    status: 'pending',
  });
  if (existing) throw ApiError.conflict('REQUEST_EXISTS', 'You already have a pending leave request');

  const leaveRequest = await LeaveRequest.create({
    project: projectId,
    user: req.user._id,
    reason,
  });

  res.status(201).json({ success: true, data: { leaveRequest } });
});

// GET /api/v1/projects/:id/leave-requests  (Admin views pending requests)
const listLeaveRequests = asyncHandler(async (req, res) => {
  // req.project is set by isProjectAdmin middleware
  const requests = await LeaveRequest.find({ project: req.project._id, status: 'pending' })
    .populate('user', 'username profile.fullName profile.githubUsername')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: { requests } });
});

// POST /api/v1/projects/:id/leave-requests/:requestId/approve
const approveLeaveRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(requestId)) throw ApiError.badRequest('INVALID_ID', 'Invalid request ID');

  const leaveRequest = await LeaveRequest.findOne({ _id: requestId, project: req.project._id });
  if (!leaveRequest) throw ApiError.notFound('REQUEST_NOT_FOUND', 'Leave request not found');
  if (leaveRequest.status !== 'pending') throw ApiError.conflict('ALREADY_PROCESSED', 'Request already processed');

  // Use transaction to ensure both update and membership deactivation happen
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // 1. Update leave request
      leaveRequest.status = 'approved';
      leaveRequest.reviewedBy = req.user._id;
      leaveRequest.reviewedAt = new Date();
      await leaveRequest.save({ session });

      // 2. Deactivate membership
      await Membership.updateOne(
        { user: leaveRequest.user, project: req.project._id },
        { $set: { status: 'inactive' } },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  res.json({ success: true, data: { message: 'Leave request approved', leaveRequest } });
});

// POST /api/v1/projects/:id/leave-requests/:requestId/reject
const rejectLeaveRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(requestId)) throw ApiError.badRequest('INVALID_ID', 'Invalid request ID');

  const leaveRequest = await LeaveRequest.findOne({ _id: requestId, project: req.project._id });
  if (!leaveRequest) throw ApiError.notFound('REQUEST_NOT_FOUND', 'Leave request not found');
  if (leaveRequest.status !== 'pending') throw ApiError.conflict('ALREADY_PROCESSED', 'Request already processed');

  leaveRequest.status = 'rejected';
  leaveRequest.reviewedBy = req.user._id;
  leaveRequest.reviewedAt = new Date();
  await leaveRequest.save();

  res.json({ success: true, data: { message: 'Leave request rejected', leaveRequest } });
});

// GET /api/v1/leave-requests/my (For members to check status of their requests)
const getMyLeaveRequests = asyncHandler(async (req, res) => {
  const requests = await LeaveRequest.find({ user: req.user._id }).populate('project', 'title');
  res.json({ success: true, data: { requests } });
});

module.exports = {
  submitLeaveRequest,
  listLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  getMyLeaveRequests,
};