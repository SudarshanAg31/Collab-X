const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    content: { type: String, required: true, trim: true, minlength: 1, maxlength: 5000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

announcementSchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);