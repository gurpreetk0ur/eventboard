const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organiser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

// A user can follow each organiser only once
followSchema.index({ follower: 1, organiser: 1 }, { unique: true });
// Looking up everyone who follows an organiser (used when an event is posted)
followSchema.index({ organiser: 1 });

module.exports = mongoose.model('Follow', followSchema);
