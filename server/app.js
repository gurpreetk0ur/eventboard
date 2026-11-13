require('dotenv').config();
const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const cors = require('cors');
const { Server } = require('socket.io');

const User = require('./models/User');

const isProduction = process.env.NODE_ENV === 'production';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eventboard';
const SESSION_SECRET = process.env.SESSION_SECRET;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const PORT = process.env.PORT || 3000;

if (isProduction && (!process.env.MONGO_URI || !SESSION_SECRET)) {
  console.error('MONGO_URI and SESSION_SECRET must be set in production.');
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');
// Behind Render's proxy, trust it so secure cookies work over HTTPS
if (isProduction) app.set('trust proxy', 1);

// 1) Body parsing and CORS ///////////////////////////////////////////////////////////////////////
app.use(express.json({ limit: '100kb' }));
// In development the React dev server runs on another port; in production both share one origin
if (!isProduction) app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));

// 2) Sessions (stored in MongoDB so logins survive restarts) and Passport ///////////////////////
const sessionMiddleware = session({
  secret: SESSION_SECRET || 'dev-only-secret-change-me',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGO_URI,
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60,
    // Clear expired sessions every 60 minutes (works on any MongoDB-compatible host)
    autoRemove: 'interval',
    autoRemoveInterval: 60,
  }),
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    maxAge: 14 * 24 * 60 * 60 * 1000,
  },
});
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());
// Store the user's id in the session; socket rooms are keyed by the same id
passport.serializeUser((user, done) => done(null, user._id.toString()));
passport.deserializeUser(async (id, done) => {
  try {
    done(null, (await User.findById(id)) || false);
  } catch (err) {
    done(err);
  }
});

// 3) Socket.IO for live notifications ////////////////////////////////////////////////////////////
const server = http.createServer(app);
const io = new Server(server, isProduction ? {} : { cors: { origin: CLIENT_ORIGIN, credentials: true } });

// Reuse the Express session so only logged-in users can connect.
// Run it only on the handshake request (no "sid" yet), as Socket.IO recommends: running it on
// later polling requests can make it write headers to a response Socket.IO has already sent.
io.engine.use((req, res, next) => {
  const isHandshake = req._query.sid === undefined;
  if (isHandshake) return sessionMiddleware(req, res, next);
  return next();
});
io.use((socket, next) => {
  const userId = socket.request.session?.passport?.user;
  if (!userId) return next(new Error('Unauthorized'));
  socket.data.userId = userId;
  return next();
});
io.on('connection', (socket) => {
  // Every tab a user has open joins the same room, so all of them get notified
  socket.join(socket.data.userId);
});
app.set('io', io);

// 4) API routes //////////////////////////////////////////////////////////////////////////////////
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/organisers', require('./routes/organisers'));
app.use('/api/follows', require('./routes/follows'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// 5) Serve the built React app (production) //////////////////////////////////////////////////////
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // Let React Router handle every other page
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// 6) Error handler ///////////////////////////////////////////////////////////////////////////////
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong.' });
});

// 7) Connect to MongoDB, then start listening ///////////////////////////////////////////////////
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
