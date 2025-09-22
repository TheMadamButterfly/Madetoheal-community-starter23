-- Postgres schema for Made to Heal Community (MVP)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  body TEXT,
  image_url TEXT,
  visibility TEXT CHECK (visibility IN ('public','members','private')) DEFAULT 'public',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  body TEXT,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT,
  created_at timestamptz DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id),
  target_type TEXT,
  target_id UUID,
  reason TEXT,
  created_at timestamptz DEFAULT now()
);
