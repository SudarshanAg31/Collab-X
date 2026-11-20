const { validationResult } = require('express-validator');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');
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

// POST /api/v1/auth/register
const register = asyncHandler(async (req, res) => {
  handleValidation(req);

  const { username, email, password, githubUsername } = req.body;

  const existing = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
  });
  if (existing) {
    throw ApiError.conflict('USER_EXISTS', 'Username or email already registered');
  }

  const user = await User.create({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password,
    githubUsername,
  });

  const token = signToken({ sub: user._id.toString() });

  res.status(201).json({
    success: true,
    data: { token, user: user.toSafeJSON() },
  });
});

// POST /api/v1/auth/login
const login = asyncHandler(async (req, res) => {
  handleValidation(req);

  const { identifier, password } = req.body; // identifier = email OR username

  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }],
  }).select('+password');

  if (!user) throw ApiError.unauthorized('INVALID_CREDENTIALS', 'Invalid credentials');
  if (!user.isActive) throw ApiError.unauthorized('USER_INACTIVE', 'Account is inactive');

  const match = await user.comparePassword(password);
  if (!match) throw ApiError.unauthorized('INVALID_CREDENTIALS', 'Invalid credentials');

  const token = signToken({ sub: user._id.toString() });

  res.json({
    success: true,
    data: { token, user: user.toSafeJSON() },
  });
});

module.exports = { register, login };