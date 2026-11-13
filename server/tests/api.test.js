// API and live-notification tests. Starts the real server against a throwaway database.
// Needs a MongoDB server: MONGO_URL (default mongodb://127.0.0.1:27017). Run with: npm test
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');
const mongoose = require('mongoose');
const { io } = require('socket.io-client');

const PORT = 3999;
const BASE = `http://localhost:${PORT}`;
const DB = `${(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017').replace(/\/$/, '')}/eventboard_test_${Date.now()}`;
let server;

async function req(method, url, body, cookie) {
  const r = await fetch(BASE + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const sc = r.headers.get('set-cookie');
  let data = null;
  try { data = await r.json(); } catch { /* empty body */ }
  return { status: r.status, data, cookie: sc ? sc.split(';')[0] : cookie };
}

const connect = (cookie) => new Promise((resolve, reject) => {
  const s = io(BASE, { extraHeaders: cookie ? { Cookie: cookie } : {}, transports: ['websocket'], reconnection: false });
  s.on('connect', () => resolve(s));
  s.on('connect_error', reject);
});

before(async () => {
  server = spawn(process.execPath, [path.join(__dirname, '..', 'app.js')], {
    env: { ...process.env, NODE_ENV: 'test', PORT: String(PORT), MONGO_URI: DB, SESSION_SECRET: 'test' },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  await new Promise((resolve, reject) => {
    server.stdout.on('data', (d) => { if (String(d).includes('listening')) resolve(); });
    server.on('exit', (code) => reject(new Error(`server exited with code ${code}`)));
  });
});

after(async () => {
  server?.kill();
  const conn = await mongoose.createConnection(DB).asPromise();
  await conn.dropDatabase();
  await conn.close();
});

test('auth, events, follows and live notifications', async () => {
  const check = (name, cond, extra = '') => assert.ok(cond, `${name} ${extra}`);
  const s = Date.now().toString(36);
  const A = 'alice' + s, B = 'bob' + s, C = 'carol' + s;
  // Auth
  check('register alice', (await req('POST', '/api/auth/register', { username: A, password: 'secret1' })).status === 201);
  await req('POST', '/api/auth/register', { username: B, password: 'secret1' });
  await req('POST', '/api/auth/register', { username: C, password: 'secret1' });
  check('duplicate username rejected', (await req('POST', '/api/auth/register', { username: A, password: 'secret1' })).status === 400);
  check('short password rejected', (await req('POST', '/api/auth/register', { username: 'x' + s, password: '123' })).status === 400);
  check('wrong password rejected', (await req('POST', '/api/auth/login', { username: A, password: 'nope123' })).status === 401);
  const a = await req('POST', '/api/auth/login', { username: A, password: 'secret1' });
  const b = await req('POST', '/api/auth/login', { username: B, password: 'secret1' });
  const c = await req('POST', '/api/auth/login', { username: C, password: 'secret1' });
  check('login returns public fields only', a.status === 200 && !('hash' in a.data) && !('salt' in a.data));
  const me = await req('GET', '/api/auth/user', null, a.cookie);
  check('current user', me.data && me.data.username === A && !me.data.hash);

  // Events
  const future = new Date(Date.now() + 3 * 864e5).toISOString();
  check('create needs login', (await req('POST', '/api/events', { title: 't', description: 'd', location: 'l', startsAt: future })).status === 401);
  check('invalid date rejected', (await req('POST', '/api/events', { title: 't', description: 'd', location: 'l', startsAt: 'nope' }, a.cookie)).status === 400);

  // Follow + live notifications
  check('cannot follow self', (await req('POST', '/api/follows/' + a.data._id, null, a.cookie)).status === 400);
  check('bob follows alice', (await req('POST', '/api/follows/' + a.data._id, null, b.cookie)).status === 201);
  check('follow status true', (await req('GET', '/api/follows/' + a.data._id, null, b.cookie)).data.following === true);
  check('anonymous socket refused', await connect(null).then(x => { x.close(); return false; }, () => true));
  const sb1 = await connect(b.cookie), sb2 = await connect(b.cookie), sc = await connect(c.cookie);
  const got = { b1: [], b2: [], c: [] };
  sb1.on('new_event', d => got.b1.push(d)); sb2.on('new_event', d => got.b2.push(d)); sc.on('new_event', d => got.c.push(d));
  const ev = await req('POST', '/api/events', { title: 'SQL Night ' + s, description: 'Learn joins', location: 'Perth', startsAt: future, tags: 'Data, SQL, ,data' }, a.cookie);
  check('alice creates event', ev.status === 201 && ev.data.notified === 1);
  check('tags normalised', JSON.stringify(ev.data.event.tags) === '["data","sql"]', JSON.stringify(ev.data.event.tags));
  await new Promise(r => setTimeout(r, 800));
  check('bob tab 1 got live notification', got.b1.length === 1 && got.b1[0].event.title === 'SQL Night ' + s && got.b1[0].event.organiser.username === A, JSON.stringify(got.b1));
  check('bob tab 2 got live notification', got.b2.length === 1);
  check('carol (not following) got nothing', got.c.length === 0);
  const nb = await req('GET', '/api/notifications', null, b.cookie);
  check('notification stored, unseen', nb.data.notifications.length === 1 && nb.data.notifications[0].seen === false && nb.data.notifications[0].event.organiser.username === A);
  await req('PATCH', '/api/notifications/seen', null, b.cookie);
  check('mark seen', (await req('GET', '/api/notifications', null, b.cookie)).data.notifications[0].seen === true);

  // Listing, search, permissions
  const past = new Date(Date.now() - 2 * 864e5).toISOString();
  await req('POST', '/api/events', { title: 'Old meetup ' + s, description: 'd', location: 'Fremantle', startsAt: past }, a.cookie);
  const up = await req('GET', '/api/events?when=upcoming&search=' + s);
  check('upcoming excludes past', up.data.events.length === 1 && up.data.events[0].title.startsWith('SQL Night'));
  const pa = await req('GET', '/api/events?when=past&search=' + s);
  check('past filter', pa.data.events.length === 1 && pa.data.events[0].title.startsWith('Old meetup'));
  check('search by location', (await req('GET', '/api/events?when=all&search=fremantle')).data.events.some(e => e.title === 'Old meetup ' + s));
  check('regex chars in search are safe', (await req('GET', '/api/events?search=' + encodeURIComponent('(.*'))).status === 200);
  const id = ev.data.event._id;
  check('get event', (await req('GET', '/api/events/' + id)).data.event.organiser.username === A);
  check('bad id gives 404', (await req('GET', '/api/events/not-an-id')).status === 404);
  check('bob cannot edit', (await req('PUT', '/api/events/' + id, { title: 'x', description: 'd', location: 'l', startsAt: future }, b.cookie)).status === 403);
  check('alice edits', (await req('PUT', '/api/events/' + id, { title: 'SQL Night v2 ' + s, description: 'd', location: 'Perth CBD', startsAt: future, tags: 'sql' }, a.cookie)).data.event.location === 'Perth CBD');
  const org = await req('GET', '/api/organisers/' + a.data._id);
  check('organiser profile', org.data.organiser.username === A && org.data.events.length === 2 && org.data.followers === 1);
  check('organisers list', (await req('GET', '/api/organisers')).data.organisers.some(o => o.username === A && o.upcoming === 1));
  check('following list', (await req('GET', '/api/follows', null, b.cookie)).data.organisers.some(o => o.username === A));
  check('non-admin blocked from admin', (await req('GET', '/api/admin', null, b.cookie)).status === 403);
  check('bob cannot delete', (await req('DELETE', '/api/events/' + id, null, b.cookie)).status === 403);
  check('alice deletes', (await req('DELETE', '/api/events/' + id, null, a.cookie)).status === 200);
  check('notification removed with event', !(await req('GET', '/api/notifications', null, b.cookie)).data.notifications.some(n => n.event._id === id));
  check('unfollow', (await req('DELETE', '/api/follows/' + a.data._id, null, b.cookie)).data.following === false);

  // Logout
  await req('POST', '/api/auth/logout', null, b.cookie);
  check('session ended after logout', (await req('GET', '/api/auth/user', null, b.cookie)).data === null);
  check('unknown api route 404', (await req('GET', '/api/nope')).status === 404);

  [sb1, sb2, sc].forEach((x) => x.close());
});
