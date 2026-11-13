const Event = require('../models/Event');
const Follow = require('../models/Follow');
const Notification = require('../models/Notification');

// Escape user input before using it inside a regular expression
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Turn "Tech, Networking ,," into ['tech', 'networking']
const parseTags = (tags) => {
  const list = Array.isArray(tags) ? tags : String(tags || '').split(',');
  return [...new Set(list.map((t) => String(t).trim().toLowerCase()).filter(Boolean))];
};

// Validate and normalise the fields of a create/edit request
const readEventInput = (body) => {
  const title = String(body.title || '').trim();
  const description = String(body.description || '').trim();
  const location = String(body.location || '').trim();
  const startsAt = new Date(body.startsAt);
  if (!title || !description || !location) {
    return { error: 'Title, description and location are required.' };
  }
  if (Number.isNaN(startsAt.getTime())) {
    return { error: 'A valid start date and time is required.' };
  }
  return { fields: { title, description, location, startsAt, tags: parseTags(body.tags) } };
};

// GET /api/events?when=upcoming|past|all&search=...
exports.listEvents = async (req, res) => {
  try {
    const when = ['upcoming', 'past', 'all'].includes(req.query.when) ? req.query.when : 'upcoming';
    const search = String(req.query.search || '').trim();
    const now = new Date();

    const filter = {};
    if (when === 'upcoming') filter.startsAt = { $gte: now };
    if (when === 'past') filter.startsAt = { $lt: now };
    if (search) {
      const re = { $regex: escapeRegex(search), $options: 'i' };
      filter.$or = [{ title: re }, { location: re }, { tags: re }];
    }

    // Upcoming: soonest first. Past: most recent first.
    const sort = when === 'upcoming' ? { startsAt: 1 } : { startsAt: -1 };
    const events = await Event.find(filter).populate('organiser', 'username').sort(sort).limit(200);
    res.json({ events });
  } catch (err) {
    console.error('listEvents error:', err);
    res.status(500).json({ error: 'Could not load events.' });
  }
};

// GET /api/events/:id
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organiser', 'username');
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    res.json({ event });
  } catch (err) {
    console.error('getEvent error:', err);
    res.status(500).json({ error: 'Could not load event.' });
  }
};

// POST /api/events — create an event, then notify the organiser's followers in real time
exports.createEvent = async (req, res) => {
  try {
    const { error, fields } = readEventInput(req.body);
    if (error) return res.status(400).json({ error });

    const event = await Event.create({ ...fields, organiser: req.user._id });

    const follows = await Follow.find({ organiser: req.user._id }).select('follower');
    if (follows.length > 0) {
      const notifications = await Notification.insertMany(
        follows.map((f) => ({ recipient: f.follower, event: event._id }))
      );
      const io = req.app.get('io');
      notifications.forEach((n) => {
        // Each logged-in user's sockets join a room named after their user id
        io.to(n.recipient.toString()).emit('new_event', {
          _id: n._id,
          seen: false,
          createdAt: n.createdAt,
          event: {
            _id: event._id,
            title: event.title,
            startsAt: event.startsAt,
            organiser: { _id: req.user._id, username: req.user.username },
          },
        });
      });
    }

    res.status(201).json({ event, notified: follows.length });
  } catch (err) {
    console.error('createEvent error:', err);
    res.status(500).json({ error: 'Could not create event.' });
  }
};

// PUT /api/events/:id — only the organiser can edit
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    if (!event.organiser.equals(req.user._id)) {
      return res.status(403).json({ error: 'Only the organiser can edit this event.' });
    }

    const { error, fields } = readEventInput(req.body);
    if (error) return res.status(400).json({ error });

    Object.assign(event, fields, { modifiedAt: Date.now() });
    await event.save();
    res.json({ event });
  } catch (err) {
    console.error('updateEvent error:', err);
    res.status(500).json({ error: 'Could not update event.' });
  }
};

// Delete an event and the notifications that point to it
const removeEvent = async (event) => {
  await Notification.deleteMany({ event: event._id });
  await event.deleteOne();
};
exports.removeEvent = removeEvent;

// DELETE /api/events/:id — only the organiser can delete
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    if (!event.organiser.equals(req.user._id)) {
      return res.status(403).json({ error: 'Only the organiser can delete this event.' });
    }
    await removeEvent(event);
    res.json({ message: 'Event deleted.' });
  } catch (err) {
    console.error('deleteEvent error:', err);
    res.status(500).json({ error: 'Could not delete event.' });
  }
};
