const Notification = require('../models/Notification');

// GET /api/notifications — newest 50, with event and organiser details
exports.list = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate({
        path: 'event',
        select: 'title startsAt organiser',
        populate: { path: 'organiser', select: 'username' },
      });
    // Skip notifications whose event has since been deleted
    res.json({ notifications: notifications.filter((n) => n.event) });
  } catch (err) {
    console.error('list notifications error:', err);
    res.status(500).json({ error: 'Could not load notifications.' });
  }
};

// PATCH /api/notifications/seen — mark all as seen
exports.markSeen = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, seen: false }, { seen: true });
    res.json({ message: 'Notifications marked as seen.' });
  } catch (err) {
    console.error('markSeen error:', err);
    res.status(500).json({ error: 'Could not update notifications.' });
  }
};
