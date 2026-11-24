const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Notice = require('../models/Notice');
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

// GET /api/v1/projects/:id/notices
const listNotices = asyncHandler(async (req, res) => {
  const items = await Notice.find({ project: req.project._id })
    .sort({ updatedAt: -1 })
    .populate('createdBy', 'username profile.fullName');

  res.json({
    success: true,
    data: {
      count: items.length,
      notices: items.map((n) => ({
        id: n._id,
        title: n.title,
        content: n.content,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
        createdBy: n.createdBy
          ? {
              id: n.createdBy._id,
              username: n.createdBy.username,
              fullName: n.createdBy.profile?.fullName || '',
            }
          : null,
      })),
    },
  });
});

// POST /api/v1/projects/:id/notices
const createNotice = asyncHandler(async (req, res) => {
  handleValidation(req);

  const { title, content } = req.body;

  const notice = await Notice.create({
    project: req.project._id,
    title,
    content,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    data: {
      notice: {
        id: notice._id,
        title: notice.title,
        content: notice.content,
        createdAt: notice.createdAt,
        updatedAt: notice.updatedAt,
      },
    },
  });
});

// PATCH /api/v1/projects/:id/notices/:noticeId
const updateNotice = asyncHandler(async (req, res) => {
  handleValidation(req);

  const { noticeId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(noticeId)) {
    throw ApiError.badRequest('INVALID_ID', 'Invalid notice id');
  }

  const notice = await Notice.findOne({ _id: noticeId, project: req.project._id });
  if (!notice) throw ApiError.notFound('NOTICE_NOT_FOUND', 'Notice not found');

  if (req.body.title !== undefined) notice.title = req.body.title;
  if (req.body.content !== undefined) notice.content = req.body.content;

  await notice.save();

  res.json({
    success: true,
    data: {
      notice: {
        id: notice._id,
        title: notice.title,
        content: notice.content,
        createdAt: notice.createdAt,
        updatedAt: notice.updatedAt,
      },
    },
  });
});

// DELETE /api/v1/projects/:id/notices/:noticeId
const deleteNotice = asyncHandler(async (req, res) => {
  const { noticeId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(noticeId)) {
    throw ApiError.badRequest('INVALID_ID', 'Invalid notice id');
  }

  const result = await Notice.deleteOne({ _id: noticeId, project: req.project._id });
  if (result.deletedCount === 0) {
    throw ApiError.notFound('NOTICE_NOT_FOUND', 'Notice not found');
  }

  res.json({ success: true, data: { deleted: true, id: noticeId } });
});

module.exports = { listNotices, createNotice, updateNotice, deleteNotice };