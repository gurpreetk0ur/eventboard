const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, maxlength: 5000 },
  startsAt: { type: Date, required: true },
  location: { type: String, required: true, trim: true, maxlength: 200 },
  tags: [{ type: String, trim: true, lowercase: true }],
  organiser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now },
});

// Listing upcoming events sorted by start time, and an organiser's events
eventSchema.index({ startsAt: 1 });
eventSchema.index({ organiser: 1, startsAt: 1 });

module.exports = mongoose.model('Event', eventSchema);
