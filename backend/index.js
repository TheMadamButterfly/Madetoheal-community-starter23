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

const app = express();                 // create app FIRST
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
    req.user =
