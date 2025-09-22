/**
 * Simple Express backend for Made to Heal Community (MVP)
 * Expects a PostgreSQL DATABASE_URL env var and JWT_SECRET.
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/madetoheal' });
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

// Simple auth middleware
function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: 'no token' });
  const token = h.replace('Bearer ', '');
  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data;
    next();
  } catch (e) {
    res.status(401).json({ error: 'invalid token' });
  }
}

// Health
app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date() }));

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, username } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email+password required' });
  const pwHash = await bcrypt.hash(password, 10);
  const q = 'INSERT INTO users(email,password_hash,name,username) VALUES($1,$2,$3,$4) RETURNING id,email,name,username,avatar_url,bio,created_at';
  try {
    const r = await pool.query(q, [email, pwHash, name || null, username || null]);
    const user = r.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email+password required' });
  try {
    const r = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (r.rowCount === 0) return res.status(401).json({ error: 'invalid' });
    const user = r.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid' });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    delete user.password_hash;
    res.json({ user, token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'login failed' });
  }
});

// Get current user
app.get('/api/me', auth, async (req, res) => {
  const r = await pool.query('SELECT id,email,name,username,avatar_url,bio,created_at FROM users WHERE id=$1', [req.user.id]);
  res.json({ user: r.rows[0] });
});

// Update profile
app.patch('/api/me', auth, async (req, res) => {
  const { name, username, avatar_url, bio } = req.body;
  const q = 'UPDATE users SET name=COALESCE($1,name), username=COALESCE($2,username), avatar_url=COALESCE($3,avatar_url), bio=COALESCE($4,bio) WHERE id=$5 RETURNING id,email,name,username,avatar_url,bio,created_at';
  const r = await pool.query(q, [name, username, avatar_url, bio, req.user.id]);
  res.json({ user: r.rows[0] });
});

// Posts
app.post('/api/posts', auth, async (req, res) => {
  const { body, image_url, visibility } = req.body;
  const q = 'INSERT INTO posts(author_id, body, image_url, visibility) VALUES($1,$2,$3,$4) RETURNING *';
  const r = await pool.query(q, [req.user.id, body || null, image_url || null, visibility || 'public']);
  res.json(r.rows[0]);
});

app.get('/api/posts/:id', async (req, res) => {
  const r = await pool.query('SELECT p.*, u.name as author_name, u.avatar_url as author_avatar FROM posts p LEFT JOIN users u on p.author_id=u.id WHERE p.id=$1', [req.params.id]);
  if (r.rowCount === 0) return res.status(404).json({ error: 'not found' });
  res.json(r.rows[0]);
});

// Feed: latest public/members posts (simple)
app.get('/api/feed', auth, async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const r = await pool.query(
    "SELECT p.*, u.name as author_name, u.avatar_url as author_avatar FROM posts p LEFT JOIN users u on p.author_id=u.id WHERE p.visibility IN ('public','members') ORDER BY created_at DESC LIMIT $1",
    [limit]
  );
  res.json(r.rows);
});

// Comments
app.post('/api/posts/:id/comments', auth, async (req, res) => {
  const { body } = req.body;
  const r = await pool.query('INSERT INTO comments(post_id,author_id,body) VALUES($1,$2,$3) RETURNING *', [req.params.id, req.user.id, body || null]);
  res.json(r.rows[0]);
});
app.get('/api/posts/:id/comments', async (req, res) => {
  const r = await pool.query('SELECT c.*, u.name as author_name FROM comments c LEFT JOIN users u on c.author_id=u.id WHERE c.post_id=$1 ORDER BY created_at ASC', [req.params.id]);
  res.json(r.rows);
});

// Like toggle
app.post('/api/posts/:id/like', auth, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  const del = await pool.query('DELETE FROM reactions WHERE post_id=$1 AND user_id=$2 RETURNING id', [postId, userId]);
  if (del.rowCount > 0) return res.json({ liked: false });
  await pool.query('INSERT INTO reactions(post_id,user_id,type) VALUES($1,$2,$3)', [postId, userId, 'like']);
  res.json({ liked: true });
});

// Simple reports (admin)
app.post('/api/reports', auth, async (req, res) => {
  const { target_type, target_id, reason } = req.body;
  const r = await pool.query('INSERT INTO reports(reporter_id,target_type,target_id,reason) VALUES($1,$2,$3,$4) RETURNING *', [req.user.id, target_type, target_id, reason || null]);
  res.json(r.rows[0]);
});

// Demo local uploads (for production, use S3)
const upload = multer({ dest: 'uploads/' });
app.post('/api/upload', auth, upload.single('file'), (req, res) => {
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('Backend running on', PORT));
