-- Drop tables if they already exist
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;

-- Basic users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'organizer'))
);

-- Events table
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  faculty TEXT,
  event_type TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  location TEXT,
  organizer_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Registrations table (RSVP)
CREATE TABLE registrations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('registered', 'cancelled')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sample data for testing
INSERT INTO users (name, email, role) VALUES
  ('Alice Organizer', 'alice@utoronto.ca', 'organizer'),
  ('Bob Student', 'bob@student.utoronto.ca', 'student');

INSERT INTO events (title, description, faculty, event_type, start_time, end_time, location, organizer_id)
VALUES
  (
    'ECE Career Fair',
    'Meet companies hiring ECE students.',
    'Engineering',
    'career',
    NOW() + INTERVAL '3 days',
    NOW() + INTERVAL '3 days 2 hours',
    'Bahen Lobby',
    1
  ),
  (
    'Machine Learning Reading Group',
    'Weekly paper discussion.',
    'Engineering',
    'academic',
    NOW() + INTERVAL '5 days',
    NOW() + INTERVAL '5 days 1 hour',
    'BA 1130',
    1
  );
