const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const OfflineMeeting = require('../models/OfflineMeeting');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

function handleValidation(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw ApiError.badRequest(
      'VALIDATION_ERROR',
      'Request validation failed',
      errors.array({ onlyFirstError: true })
    );
  }
}

// GET /api/v1/projects/:id/meetings
const listMeetings = asyncHandler(async (req, res) => {
  const items = await OfflineMeeting.find({ project: req.project._id })
    .sort({ meetingDate: 1 })
    .populate('createdBy', 'username profile.fullName');

  res.json({
    success: true,
    data: {
      count: items.length,
      meetings: items.map((m) => ({
        id: m._id,
        meetingDate: m.meetingDate,
        meetingTime: m.meetingTime,
        venue: m.venue,
        agenda: m.agenda,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        createdBy: m.createdBy
          ? {
              id: m.createdBy._id,
              username: m.createdBy.username,
              fullName: m.createdBy.profile?.fullName || '',
            }
          : null,
      })),
    },
  });
});

// POST /api/v1/projects/:id/meetings
const createMeeting = asyncHandler(async (req, res) => {
  handleValidation(req);

  const { meetingDate, meetingTime, venue, agenda } = req.body;

  const meeting = await OfflineMeeting.create({
    project: req.project._id,
    meetingDate: new Date(meetingDate),
    meetingTime,
    venue,
    agenda,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    data: {
      meeting: {
        id: meeting._id,
        meetingDate: meeting.meetingDate,
        meetingTime: meeting.meetingTime,
        venue: meeting.venue,
        agenda: meeting.agenda,
        createdAt: meeting.createdAt,
      },
    },
  });
});

// PATCH /api/v1/projects/:id/meetings/:meetingId
const updateMeeting = asyncHandler(async (req, res) => {
  handleValidation(req);

  const { meetingId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(meetingId)) {
    throw ApiError.badRequest('INVALID_ID', 'Invalid meeting id');
  }

  const meeting = await OfflineMeeting.findOne({
    _id: meetingId,
    project: req.project._id,
  });
  if (!meeting) throw ApiError.notFound('MEETING_NOT_FOUND', 'Meeting not found');

  if (req.body.meetingDate !== undefined) meeting.meetingDate = new Date(req.body.meetingDate);
  if (req.body.meetingTime !== undefined) meeting.meetingTime = req.body.meetingTime;
  if (req.body.venue !== undefined) meeting.venue = req.body.venue;
  if (req.body.agenda !== undefined) meeting.agenda = req.body.agenda;

  await meeting.save();

  res.json({
    success: true,
    data: {
      meeting: {
        id: meeting._id,
        meetingDate: meeting.meetingDate,
        meetingTime: meeting.meetingTime,
        venue: meeting.venue,
        agenda: meeting.agenda,
        createdAt: meeting.createdAt,
        updatedAt: meeting.updatedAt,
      },
    },
  });
});

// DELETE /api/v1/projects/:id/meetings/:meetingId
const deleteMeeting = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(meetingId)) {
    throw ApiError.badRequest('INVALID_ID', 'Invalid meeting id');
  }

  const result = await OfflineMeeting.deleteOne({
    _id: meetingId,
    project: req.project._id,
  });

  if (result.deletedCount === 0) {
    throw ApiError.notFound('MEETING_NOT_FOUND', 'Meeting not found');
  }

  res.json({ success: true, data: { deleted: true, id: meetingId } });
});

module.exports = { listMeetings, createMeeting, updateMeeting, deleteMeeting };