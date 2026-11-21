const mongoose = require('mongoose');

const offlineMeetingSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    meetingDate: { type: Date, required: true },
    meetingTime: { type: String, required: true, trim: true, maxlength: 10 }, // "14:30" or "14:30-15:30"
    venue: { type: String, required: true, trim: true, maxlength: 200 },
    agenda: { type: String, required: true, trim: true, maxlength: 2000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

offlineMeetingSchema.index({ project: 1, meetingDate: 1 });

module.exports = mongoose.model('OfflineMeeting', offlineMeetingSchema);