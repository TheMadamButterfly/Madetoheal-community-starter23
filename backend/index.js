/**
 * Made to Heal — Backend (MVP)
 * Node runtime on Render (no Docker).
 * Requires env: DATABASE_URL, JWT_SECRET
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();                 // <-- create app FIRST
app.use(cors());
app.use(express.json());

// Connect to Postgres (Render injects DATABASE_URL from your DB)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

// Auto-apply schema on startup (creates tables if missing)
(async () => {
  try {
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(sql);
    console.log('Schema applied/verified.');
  } catch (e) {
    console.error('Schema apply failed (continuing):', e.message);
  }
})();

// Simple auth middleware (expects "Authorization: Bearer <token>")
function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: 'no token' });
  const token = h.replace('Bearer ', '');
  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data;
    next();
  } catch {
    res.status(401).json({ error: 'invalid token' });
  }
}

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date() }));

// --- Auth ---
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, username } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email+password required' });
  try {
    const pwHash = await bcrypt.hash(password, 10);
    const q = `INSERT INTO users(email,password_hash,name,username)
               VALUES($1,$2,$3,$4)
               RETURNING id,email,name,username,avatar_url,bio,created_at`;
    const r = await pool.query(q, [email, pwHash, name || null, username || null]);
    const user = r.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'registration failed' });
  }
});

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

// --- Me ---
app.get('/api/me', auth, async (req, res) => {
  const r = await pool.query(
    'SELECT id,email,name,username,avatar_url,bio,created_at FROM users WHERE id=$1',
    [req.user.id]
  );
  res.json({ user: r.rows[0] });
});

app.patch('/api/me', auth, async (req, res) => {
  const { name, username, avatar_url, bio } = req.body;
  const q = `UPDATE users
             SET name=COALESCE($1,name),
                 username=COALESCE($2,username),
                 avatar_url=COALESCE($3,avatar_url),
                 bio=COALESCE($4,bio)
             WHERE id=$5
             RETURNING id,email,name,username,avatar_url,bio,created_at`;
  const r = await pool.query(q, [name, username, avatar_url, bio, req.user.id]);
  res.json({ user: r.rows[0] });
});

// --- Posts ---
app.post('/api/posts', auth, async (req, res) => {
  const { body, image_url, visibility } = req.body;
  const q = `INSERT INTO posts(author_id, body, image_url, visibility)
             VAL
