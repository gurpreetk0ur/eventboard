const Follow = require('../models/Follow');
const User = require('../models/User');

// POST /api/follows/:organiserId
exports.follow = async (req, res) => {
  try {
    const { organiserId } = req.params;
    if (req.user._id.equals(organiserId)) {
      return res.status(400).json({ error: 'You cannot follow yourself.' });
    }
    const organiser = await User.findById(organiserId).select('_id');
    if (!organiser) return res.status(404).json({ error: 'Organiser not found.' });

    await Follow.create({ follower: req.user._id, organiser: organiserId });
    res.status(201).json({ following: true });
  } catch (err) {
    if (err.code === 11000) return res.json({ following: true }); // already following
    console.error('follow error:', err);
    res.status(500).json({ error: 'Could not follow organiser.' });
  }
};

// DELETE /api/follows/:organiserId
exports.unfollow = async (req, res) => {
  try {
    await Follow.deleteOne({ follower: req.user._id, organiser: req.params.organiserId });
    res.json({ following: false });
  } catch (err) {
    console.error('unfollow error:', err);
    res.status(500).json({ error: 'Could not unfollow organiser.' });
  }
};

// GET /api/follows/:organiserId — is the current user following this organiser?
exports.status = async (req, res) => {
  try {
    const existing = await Follow.exists({ follower: req.user._id, organiser: req.params.organiserId });
    res.json({ following: Boolean(existing) });
  } catch (err) {
    console.error('follow status error:', err);
    res.status(500).json({ error: 'Could not check follow status.' });
  }
};

// GET /api/follows — organisers the current user follows
exports.list = async (req, res) => {
  try {
    const follows = await Follow.find({ follower: req.user._id }).populate('organiser', 'username');
    res.json({ organisers: follows.map((f) => f.organiser).filter(Boolean) });
  } catch (err) {
    console.error('follow list error:', err);
    res.status(500).json({ error: 'Could not load followed organisers.' });
  }
};
