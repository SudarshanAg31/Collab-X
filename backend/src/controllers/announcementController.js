const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Announcement = require('../models/Announcement');
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

// GET /api/v1/projects/:id/announcements
const listAnnouncements = asyncHandler(async (req, res) => {
  const items = await Announcement.find({ project: req.project._id })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'username profile.fullName');

  res.json({
    success: true,
    data: {
      count: items.length,
      announcements: items.map((a) => ({
        id: a._id,
        title: a.title,
        content: a.content,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        createdBy: a.createdBy
          ? {
              id: a.createdBy._id,
              username: a.createdBy.username,
              fullName: a.createdBy.profile?.fullName || '',
            }
          : null,
      })),
    },
  });
});

// POST /api/v1/projects/:id/announcements
const createAnnouncement = asyncHandler(async (req, res) => {
  handleValidation(req);

  const { title, content } = req.body;

  const announcement = await Announcement.create({
    project: req.project._id,
    title,
    content,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    data: {
      announcement: {
        id: announcement._id,
        title: announcement.title,
        content: announcement.content,
        createdAt: announcement.createdAt,
      },
    },
  });
});

// PATCH /api/v1/projects/:id/announcements/:announcementId
const updateAnnouncement = asyncHandler(async (req, res) => {
  handleValidation(req);

  const { announcementId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(announcementId)) {
    throw ApiError.badRequest('INVALID_ID', 'Invalid announcement id');
  }

  const announcement = await Announcement.findOne({
    _id: announcementId,
    project: req.project._id,
  });
  if (!announcement) {
    throw ApiError.notFound('ANNOUNCEMENT_NOT_FOUND', 'Announcement not found');
  }

  if (req.body.title !== undefined) announcement.title = req.body.title;
  if (req.body.content !== undefined) announcement.content = req.body.content;

  await announcement.save();

  res.json({
    success: true,
    data: {
      announcement: {
        id: announcement._id,
        title: announcement.title,
        content: announcement.content,
        createdAt: announcement.createdAt,
        updatedAt: announcement.updatedAt,
      },
    },
  });
});

// DELETE /api/v1/projects/:id/announcements/:announcementId
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const { announcementId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(announcementId)) {
    throw ApiError.badRequest('INVALID_ID', 'Invalid announcement id');
  }

  const result = await Announcement.deleteOne({
    _id: announcementId,
    project: req.project._id,
  });

  if (result.deletedCount === 0) {
    throw ApiError.notFound('ANNOUNCEMENT_NOT_FOUND', 'Announcement not found');
  }

  res.json({ success: true, data: { deleted: true, id: announcementId } });
});

module.exports = {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};