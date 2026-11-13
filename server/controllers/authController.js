const passport = require('passport');
const User = require('../models/User');

// GET /api/auth/user — the logged-in user, or null
exports.getCurrentUser = (req, res) => {
  res.json(req.user ? req.user.toPublic() : null);
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');
    if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(username)) {
      return res.status(400).json({
        error: 'Username must be 3–30 characters: letters, numbers, dots, dashes or underscores.',
      });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }
    const user = await User.register(new User({ username }), password);
    res.status(201).json(user.toPublic());
  } catch (err) {
    if (err.name === 'UserExistsError') {
      return res.status(400).json({ error: 'That username is already taken.' });
    }
    console.error('register error:', err);
    res.status(400).json({ error: err.message || 'Could not register.' });
  }
};

// POST /api/auth/login
exports.login = (req, res, next) => {
  passport.authenticate('local', (err, user) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: 'Incorrect username or password.' });
    req.logIn(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      return res.json(user.toPublic());
    });
  })(req, res, next);
};

// POST /api/auth/logout
exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out.' });
    });
  });
};
