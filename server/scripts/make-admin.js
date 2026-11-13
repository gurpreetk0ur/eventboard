// Usage: npm run make-admin -- <username>
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  const username = process.argv[2];
  if (!username) {
    console.error('Usage: npm run make-admin -- <username>');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eventboard');
  const result = await User.updateOne({ username }, { isAdmin: true });
  console.log(result.matchedCount ? `${username} is now an admin.` : `No user called "${username}".`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
