const express = require('express');
const User = require('../models/User');
const Event = require('../models/Event');
const Follow = require('../models/Follow');
const { validId } = require('../middlewares/auth');

const router = express.Router();

// GET /api/organisers — everyone who has posted at least one upcoming event
router.get('/', async (req, res) => {
  try {
    const counts = await Event.aggregate([
      { $match: { startsAt: { $gte: new Date() } } },
      { $group: { _id: '$organiser', upcoming: { $sum: 1 } } },
    ]);
    const users = await User.find({ _id: { $in: counts.map((c) => c._id) } }).select('username');
    const byId = new Map(counts.map((c) => [c._id.toString(), c.upcoming]));
    const organisers = users
      .map((u) => ({ _id: u._id, username: u.username, upcoming: byId.get(u._id.toString()) || 0 }))
      .sort((a, b) => b.upcoming - a.upcoming || a.username.localeCompare(b.username));
    res.json({ organisers });
  } catch (err) {
    console.error('GET /api/organisers error:', err);
    res.status(500).json({ error: 'Could not load organisers.' });
  }
});

// GET /api/organisers/:id — profile, follower count and events (upcoming first)
router.get('/:id', validId('id'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('username');
    if (!user) return res.status(404).json({ error: 'Organiser not found.' });

    const [events, followers] = await Promise.all([
      Event.find({ organiser: user._id }).sort({ startsAt: 1 }).select('title startsAt location tags'),
      Follow.countDocuments({ organiser: user._id }),
    ]);
    res.json({ organiser: { _id: user._id, username: user.username }, followers, events });
  } catch (err) {
    console.error('GET /api/organisers/:id error:', err);
    res.status(500).json({ error: 'Could not load organiser.' });
  }
});

module.exports = router;
