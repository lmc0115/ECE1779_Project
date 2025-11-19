-- Enable UUID extension for future use
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they already exist (in reverse dependency order)
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS rsvps;
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;

-- Users table (with authentication support)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- For JWT authentication
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'organizer', 'admin')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  organizer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  faculty TEXT,
  category TEXT, -- Alternative to event_type for categorization
  event_type TEXT, -- Keep for backward compatibility
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  capacity INTEGER, -- NULL means unlimited
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Registrations table (legacy/alternative to rsvps)
CREATE TABLE registrations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('registered', 'cancelled')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- RSVPs table (used by backend API)
CREATE TABLE rsvps (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('going', 'interested', 'cancelled')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_event_user UNIQUE (event_id, user_id)
);

-- Comments table (for event discussions)
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for events table
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_faculty ON events(faculty) WHERE faculty IS NOT NULL;
CREATE INDEX idx_events_category ON events(category) WHERE category IS NOT NULL;
CREATE INDEX idx_events_event_type ON events(event_type) WHERE event_type IS NOT NULL;
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_organizer_id ON events(organizer_id);

-- Indexes for registrations table
CREATE INDEX idx_registrations_user_id ON registrations(user_id);
CREATE INDEX idx_registrations_event_id ON registrations(event_id);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_created_at ON registrations(created_at);

-- Indexes for rsvps table
CREATE INDEX idx_rsvps_event_id ON rsvps(event_id);
CREATE INDEX idx_rsvps_user_id ON rsvps(user_id);
CREATE INDEX idx_rsvps_status ON rsvps(status);

-- Indexes for comments table
CREATE INDEX idx_comments_event_id ON comments(event_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- Indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at
    BEFORE UPDATE ON registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample Data (Note: password_hash should be set via API with proper bcrypt hashing)
-- These are placeholder values - in production, use bcrypt to hash passwords
INSERT INTO users (email, password_hash, name, role) VALUES
  ('alice@utoronto.ca', '$2b$10$placeholder_hash_for_alice', 'Alice Organizer', 'organizer'),
  ('bob@student.utoronto.ca', '$2b$10$placeholder_hash_for_bob', 'Bob Student', 'student');

INSERT INTO events (organizer_id, title, description, location, faculty, category, event_type, start_time, end_time, status, capacity)
VALUES
  (
    1,
    'ECE Career Fair',
    'Meet companies hiring ECE students.',
    'Bahen Lobby',
    'Engineering',
    'career',
    'career',
    NOW() + INTERVAL '3 days',
    NOW() + INTERVAL '3 days 2 hours',
    'upcoming',
    200
  ),
  (
    1,
    'Machine Learning Reading Group',
    'Weekly paper discussion.',
    'BA 1130',
    'Engineering',
    'academic',
    'academic',
    NOW() + INTERVAL '5 days',
    NOW() + INTERVAL '5 days 1 hour',
    'upcoming',
    NULL
  );