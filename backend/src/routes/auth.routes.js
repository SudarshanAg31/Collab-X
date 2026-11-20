const express = require('express');
const { body } = require('express-validator');
const { register, login } = require('../controllers/authController');

const router = express.Router();

router.post(
  '/register',
  [
    body('username')
      .isString()
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be 3-30 chars')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username may only contain letters, digits, underscores'),
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').isString().isLength({ min: 8 }).withMessage('Password must be at least 8 chars'),
    body('githubUsername')
      .isString()
      .trim()
      .isLength({ min: 1, max: 39 })
      .withMessage('GitHub username required')
      .matches(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i)
      .withMessage('Invalid GitHub username format'),
  ],
  register
);

router.post(
  '/login',
  [
    body('identifier').isString().trim().notEmpty().withMessage('Email or username required'),
    body('password').isString().notEmpty().withMessage('Password required'),
  ],
  login
);

module.exports = router;