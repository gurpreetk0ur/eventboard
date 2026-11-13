const express = require('express');
const User = require('../models/User');
const Event = require('../models/Event');
const { removeEvent } = require('../controllers/eventController');
const { isAdmin, validId } = require('../middlewares/auth');

const router = express.Router();
router.use(isAdmin);

// GET /api/admin — all users and events for moderation
router.get('/', async (req, res) => {
  try {
    const [users, events] = await Promise.all([
      User.find().select('username isAdmin').sort({ username: 1 }),
      Event.find().populate('organiser', 'username').sort({ startsAt: -1 }),
    ]);
    res.json({ users, events });
  } catch (err) {
    console.error('GET /api/admin error:', err);
    res.status(500).json({ error: 'Could not load admin data.' });
  }
});

// DELETE /api/admin/events/:id — remove any event
router.delete('/events/:id', validId('id'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    await removeEvent(event);
    res.json({ message: 'Event deleted.' });
  } catch (err) {
    console.error('DELETE /api/admin/events error:', err);
    res.status(500).json({ error: 'Could not delete event.' });
  }
});

module.exports = router;
