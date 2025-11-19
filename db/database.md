# UniConn Database Documentation

This document describes the PostgreSQL database design, schema, development setup, and usage guidelines for the UniConn Event Platform (ECE1779 Project).
As the single source of truth, all backend and DevOps components must follow this specification.

## 1. Overview

The UniConn platform stores users, events, and registration data inside a PostgreSQL database.  
The complete schema is defined in:

```
db/schema.sql
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
Stores user and organizer accounts.

| Field | Type | Constraints |
|-------|------|-------------|
| id | SERIAL | PK |
| name | TEXT | NOT NULL |
| email | TEXT | UNIQUE, NOT NULL |
| role | TEXT | CHECK ('student' or 'organizer') |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | Auto-updated |

#### events
Stores published events.

| Field | Type | Notes |
|-------|------|--------|
| id | SERIAL | PK |
| title | TEXT | NOT NULL |
| description | TEXT | Optional |
| faculty | TEXT | e.g., Engineering |
| event_type | TEXT | e.g., career |
| start_time | TIMESTAMP | NOT NULL |
| end_time | TIMESTAMP | Optional |
| location | TEXT | Optional |
| organizer_id | INTEGER | FK → users(id) |
| status | TEXT | upcoming/ongoing/completed/cancelled |
| capacity | INTEGER | NULL = unlimited |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | Auto-updated |

#### registrations
Many-to-many relationship between users and events.

| Field | Type | Notes |
|-------|------|--------|
| id | SERIAL | PK |
| user_id | INTEGER | FK → users(id), cascade delete |
| event_id | INTEGER | FK → events(id), cascade delete |
| status | TEXT | registered / cancelled |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | Auto-updated |

Unique constraint:
```
UNIQUE(user_id, event_id)
```

### 2.2 Relationships (ER Diagram Summary)
users (1) —— (many) events  
users (many) —— (many) events via registrations  

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
SELECT * FROM registrations;
```

## 6. Responsibility Allocation
Schema: Vicky  
Backend: Backend Team  
DevOps: DevOps Team  
