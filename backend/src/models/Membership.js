const mongoose = require('mongoose');
const {
  MEMBERSHIP_ROLE_VALUES,
  MEMBERSHIP_STATUS_VALUES,
} = require('../config/constants');

const membershipSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    role: { type: String, enum: MEMBERSHIP_ROLE_VALUES, required: true },
    status: { type: String, enum: MEMBERSHIP_STATUS_VALUES, default: 'active' },
    joinedAt: { type: Date, default: Date.now },

    // ── GitHub invite lifecycle (populated in Module 10) ────────
    githubInviteStatus: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'retrying', 'not_applicable'],
      default: 'pending',
    },
    githubInviteAttempts: { type: Number, default: 0 },
    githubInviteLastError: { type: String, default: '' },
    githubInviteUpdatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

membershipSchema.index({ user: 1, project: 1 }, { unique: true });
membershipSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Membership', membershipSchema);