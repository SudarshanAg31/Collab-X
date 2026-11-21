const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_]+$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    githubUsername: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: { type: Boolean, default: true },
    isProfileComplete: { type: Boolean, default: false },
    profile: {
      fullName: { type: String, default: '', trim: true },
      bio: { type: String, default: '', trim: true, maxlength: 500 },
      experienceLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', null],
        default: null,
      },
      category: { type: String, default: null },
      skills: { type: [String], default: [] },
      linkedinUrl: { type: String, default: '' },
      portfolioUrl: { type: String, default: '' },
    },

    // ── Module 10: GitHub OAuth (never returned by toSafeJSON) ──
    githubOAuth: {
      accessTokenEnc: { type: String, select: false },
      iv: { type: String, select: false },
      authTag: { type: String, select: false },
      scopes: { type: [String], default: [] },
      githubLogin: { type: String, default: '' },
      obtainedAt: { type: Date, default: null },
    },
    githubVerified: {
      status: {
        type: String,
        enum: ['unverified', 'verified', 'not_found'],
        default: 'unverified',
      },
      checkedAt: { type: Date, default: null },
    },
    projectGuardVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Hash password before save (Mongoose 8 — async, NO next arg)
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    githubUsername: this.githubUsername,
    isActive: this.isActive,
    isProfileComplete: this.isProfileComplete,
    profile: this.profile,
    githubVerified: this.githubVerified,
    // DO NOT include githubOAuth — it must never leave the backend.
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);