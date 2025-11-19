# UniConn Database Documentation

This document describes the PostgreSQL database design, schema, development setup, and usage guidelines for the UniConn Event Platform (ECE1779 Project).
As the single source of truth, all backend and DevOps components must follow this specification.

## 1. Overview

The UniConn platform stores users, events, and registration data inside a PostgreSQL database.  
The complete schema is defined in:

```
uniconn-backend/db/schema.sql
```

This file includes:
- Table definitions
- Foreign key constraints
- Indexes for performance
- Triggers for automatic timestamp updates
- Sample data for development

## 2. Database Schema

### 2.1 Tables

#### users
Stores user and organizer accounts with authentication support.

| Field | Type | Constraints |
|-------|------|-------------|
| id | SERIAL | PK |
| email | TEXT | UNIQUE, NOT NULL |
| password_hash | TEXT | NOT NULL (for JWT authentication) |
| name | TEXT | Optional |
| role | TEXT | CHECK ('student', 'organizer', or 'admin') |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | Auto-updated |

#### events
Stores published events.

| Field | Type | Notes |
|-------|------|--------|
| id | SERIAL | PK |
| organizer_id | INTEGER | FK → users(id), NOT NULL |
| title | TEXT | NOT NULL |
| description | TEXT | Optional |
| location | TEXT | Optional |
| faculty | TEXT | e.g., Engineering |
| category | TEXT | Alternative categorization (e.g., career, academic) |
| event_type | TEXT | Legacy field, kept for backward compatibility |
| start_time | TIMESTAMP | NOT NULL |
| end_time | TIMESTAMP | Optional |
| status | TEXT | DEFAULT 'upcoming', CHECK (upcoming/ongoing/completed/cancelled) |
| capacity | INTEGER | NULL = unlimited |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | Auto-updated |

#### registrations
Legacy/alternative table for user-event relationships.

| Field | Type | Notes |
|-------|------|--------|
| id | SERIAL | PK |
| user_id | INTEGER | FK → users(id), cascade delete |
| event_id | INTEGER | FK → events(id), cascade delete |
| status | TEXT | registered / cancelled |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | Auto-updated |

Unique constraint: `UNIQUE(user_id, event_id)`

#### rsvps
Primary table for user RSVP functionality (used by backend API).

| Field | Type | Notes |
|-------|------|--------|
| id | SERIAL | PK |
| event_id | INTEGER | FK → events(id), cascade delete |
| user_id | INTEGER | FK → users(id), cascade delete |
| status | TEXT | going / interested / cancelled |
| created_at | TIMESTAMP | DEFAULT NOW() |

Unique constraint: `UNIQUE(event_id, user_id)`

#### comments
Stores event discussion comments.

| Field | Type | Notes |
|-------|------|--------|
| id | SERIAL | PK |
| event_id | INTEGER | FK → events(id), cascade delete |
| user_id | INTEGER | FK → users(id), cascade delete |
| body | TEXT | NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |

### 2.2 Relationships (ER Diagram Summary)
users (1) —— (many) events  
users (many) —— (many) events via rsvps  
users (many) —— (many) events via registrations (legacy)  
users (many) —— (many) comments on events  

### 2.3 Indexes
Events, registrations, and users include optimized indexes for common query patterns.

### 2.4 Triggers
All tables auto-update `updated_at` using:
```
update_updated_at_column()
```

## 3. Local Development Setup

### Start database:
```
docker compose -f docker-compose.db.yml up -d
```

### Credentials:
DB_HOST=localhost  
DB_PORT=5432  
DB_NAME=uniconn  
DB_USER=uniconn  
DB_PASSWORD=devpassword  

## 4. Updating the Schema
```
docker compose -f docker-compose.db.yml down -v
docker compose -f docker-compose.db.yml up -d
```

## 5. Seed Data
```
SELECT * FROM users;
SELECT * FROM events;
SELECT * FROM rsvps;
SELECT * FROM comments;
SELECT * FROM registrations;  -- Legacy table
```

## 6. Responsibility Allocation
Schema: Vicky  
Backend: Backend Team  
DevOps: DevOps Team  
