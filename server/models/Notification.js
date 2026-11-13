const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  seen: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Efficient lookup of a user's notifications and unseen count
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, seen: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
