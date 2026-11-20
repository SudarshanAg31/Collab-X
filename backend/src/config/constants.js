// Single source of truth for all enums. Extend in ONE place.
const CATEGORIES = Object.freeze({
  WEB: 'web',
  MOBILE: 'mobile',
  AI_ML: 'ai_ml',
  DEVOPS: 'devops',
  BLOCKCHAIN: 'blockchain',
  GAME: 'game',
  OTHER: 'other',
});

const EXPERIENCE_LEVELS = Object.freeze({
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
});

const PROJECT_STATUS = Object.freeze({
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
});

const MEMBERSHIP_ROLE = Object.freeze({
  OWNER: 'owner',
  MEMBER: 'member',
});

const MEMBERSHIP_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
});

module.exports = {
  CATEGORIES,
  CATEGORY_VALUES: Object.values(CATEGORIES),
  EXPERIENCE_LEVELS,
  EXPERIENCE_LEVEL_VALUES: Object.values(EXPERIENCE_LEVELS),
  PROJECT_STATUS,
  PROJECT_STATUS_VALUES: Object.values(PROJECT_STATUS),
  MEMBERSHIP_ROLE,
  MEMBERSHIP_ROLE_VALUES: Object.values(MEMBERSHIP_ROLE),
  MEMBERSHIP_STATUS,
  MEMBERSHIP_STATUS_VALUES: Object.values(MEMBERSHIP_STATUS),
};