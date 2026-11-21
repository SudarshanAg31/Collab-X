const { validationResult } = require('express-validator');
const User = require('../models/User');
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

// Backend-only completeness rule.
function computeIsProfileComplete(profile) {
  return Boolean(
    profile &&
      profile.fullName &&
      profile.fullName.trim().length >= 2 &&
      profile.experienceLevel &&
      profile.category &&
      Array.isArray(profile.skills) &&
      profile.skills.length >= 1
  );
}

// GET /api/v1/users/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toSafeJSON() } });
});

// GET /api/v1/users/profile
const getProfile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      profile: req.user.profile,
      isProfileComplete: req.user.isProfileComplete,
    },
  });
});

// PATCH /api/v1/users/profile
const updateProfile = asyncHandler(async (req, res) => {
  handleValidation(req);

  const user = await User.findById(req.user._id);

  const allowed = [
    'fullName',
    'bio',
    'experienceLevel',
    'category',
    'skills',
    'linkedinUrl',
    'portfolioUrl',
  ];

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      user.profile[key] = req.body[key];
    }
  }

  // Trim, drop empties, dedupe (case-sensitive, order preserved), cap 30.
  if (Array.isArray(req.body.skills)) {
    user.profile.skills = Array.from(
      new Set(req.body.skills.map((s) => String(s).trim()).filter(Boolean))
    ).slice(0, 30);
  }

  // Backend recomputes — client cannot force this flag.
  user.isProfileComplete = computeIsProfileComplete(user.profile);

  await user.save();

  res.json({
    success: true,
    data: {
      user: user.toSafeJSON(),
      isProfileComplete: user.isProfileComplete,
    },
  });
});

module.exports = { getMe, getProfile, updateProfile };