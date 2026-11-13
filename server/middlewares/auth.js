// Only logged-in users may continue
exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Please log in first.' });
};

// Only logged-in admins may continue
exports.isAdmin = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user.isAdmin) return next();
  return res.status(403).json({ error: 'Admin access required.' });
};

// Reject malformed MongoDB ids before they reach the database
const mongoose = require('mongoose');
exports.validId = (param) => (req, res, next) => {
  if (mongoose.isValidObjectId(req.params[param])) return next();
  return res.status(404).json({ error: 'Not found.' });
};
