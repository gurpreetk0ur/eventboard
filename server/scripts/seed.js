// Fills the database with demo organisers and events so the live site isn't empty.
// Usage: npm run seed   (removes existing events, follows and notifications first)
// Demo accounts all use the password in SEED_PASSWORD (default: demo1234).
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');
const Follow = require('../models/Follow');
const Notification = require('../models/Notification');

const PASSWORD = process.env.SEED_PASSWORD || 'demo1234';
const DAY = 24 * 60 * 60 * 1000;

// Days from now at a given local hour
const at = (days, hour, minute = 0) => {
  const d = new Date(Date.now() + days * DAY);
  d.setHours(hour, minute, 0, 0);
  return d;
};

const organisers = [
  {
    username: 'perth_data_club',
    events: [
      { title: 'Intro to SQL Workshop', days: 6, hour: 18, location: 'State Library of WA, Perth', tags: 'data, sql, beginners',
        description: 'A hands-on evening learning SELECT, JOIN and GROUP BY with a real dataset. Bring a laptop; no experience needed.' },
      { title: 'Data Viz Show & Tell', days: 20, hour: 18, minute: 30, location: 'Online', tags: 'data, visualisation',
        description: 'Five-minute lightning talks: share a chart you are proud of (or one that went wrong) and what you learned.' },
      { title: 'Open Data Hack Night', days: -12, hour: 17, location: 'Northbridge co-working space', tags: 'data, open data, hackathon',
        description: 'Teams explored public WA datasets and built quick dashboards in three hours.' },
    ],
  },
  {
    username: 'fremantle_coders',
    events: [
      { title: 'JavaScript Study Group', days: 3, hour: 18, location: 'Fremantle Library', tags: 'javascript, web dev',
        description: 'Weekly study session working through modern JavaScript together. All levels welcome.' },
      { title: 'Build Your First React App', days: 13, hour: 10, location: 'Fremantle Arts Centre', tags: 'react, web dev, workshop',
        description: 'A morning workshop building and deploying a small React app from scratch.' },
    ],
  },
  {
    username: 'kings_park_walkers',
    events: [
      { title: 'Sunrise Walk & Coffee', days: 2, hour: 6, location: 'Kings Park, Fraser Avenue entrance', tags: 'outdoors, social',
        description: 'An easy 5 km loop through the park, finishing with coffee at the cafe. Meet at the entrance.' },
      { title: 'Wildflower Trail Walk', days: 27, hour: 8, location: 'Kings Park Botanic Garden', tags: 'outdoors, nature',
        description: 'A guided walk through the wildflower displays with a volunteer guide.' },
    ],
  },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eventboard');
  await Promise.all([Event.deleteMany({}), Follow.deleteMany({}), Notification.deleteMany({})]);

  const users = {};
  for (const name of [...organisers.map((o) => o.username), 'demo_user']) {
    let user = await User.findOne({ username: name });
    if (!user) user = await User.register(new User({ username: name }), PASSWORD);
    users[name] = user;
  }

  for (const o of organisers) {
    for (const e of o.events) {
      await Event.create({
        title: e.title,
        description: e.description,
        location: e.location,
        startsAt: at(e.days, e.hour, e.minute),
        tags: e.tags.split(',').map((t) => t.trim()),
        organiser: users[o.username]._id,
      });
    }
  }

  // The demo user follows two organisers, so posting as one of them shows a live notification
  await Follow.create([
    { follower: users.demo_user._id, organiser: users.perth_data_club._id },
    { follower: users.demo_user._id, organiser: users.fremantle_coders._id },
  ]);

  console.log(`Seeded ${organisers.length} organisers and ${organisers.reduce((n, o) => n + o.events.length, 0)} events.`);
  console.log(`Log in as demo_user (or any organiser) with password: ${PASSWORD}`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
