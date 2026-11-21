const mongoose = require('mongoose');
const {
  CATEGORY_VALUES,
  EXPERIENCE_LEVEL_VALUES,
  PROJECT_STATUS_VALUES,
} = require('../config/constants');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 5000,
    },
    summary: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    category: {
      type: String,
      required: true,
      enum: CATEGORY_VALUES,
    },
    techStack: {
      type: [String],
      default: [],
    },
    githubRepoUrl: {
      type: String,
      required: true,
      trim: true,
      match: /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/,
    },
    requiredMembers: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
    },
    experienceLevel: {
      type: String,
      required: true,
      enum: EXPERIENCE_LEVEL_VALUES,
    },
    status: {
      type: String,
      enum: PROJECT_STATUS_VALUES,
      default: 'open',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Normalise techStack: trim, drop empties, dedupe, cap 20.
projectSchema.pre('validate', function normalizeTech() {
  if (Array.isArray(this.techStack)) {
    this.techStack = Array.from(
      new Set(this.techStack.map((t) => String(t).trim()).filter(Boolean))
    ).slice(0, 20);
  }
});

projectSchema.methods.toJSONSafe = function toJSONSafe() {
  return {
    id: this._id,
    title: this.title,
    description: this.description,
    summary: this.summary,
    category: this.category,
    techStack: this.techStack,
    githubRepoUrl: this.githubRepoUrl,
    requiredMembers: this.requiredMembers,
    experienceLevel: this.experienceLevel,
    status: this.status,
    owner: this.owner,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('Project', projectSchema);