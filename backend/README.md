# UConnect Backend – Minimal Backend Documentation

## 1. Overview

This backend provides a simple REST API for the UConnect event management system.  
It supports:

- Creating and viewing events  
- Editing and deleting events  
- User event registrations (RSVP)  
- Cancelling registrations  

The system uses:

- **Node.js + Express**
- **PostgreSQL**
- **Docker Compose**

---

## 2. Base URL

```
http://localhost:3000
```

---

## 3. Health Check

### GET /health

Response:

```json
{ "status": "ok", "db": 1 }
```

---

## 4. Event API

### 4.1 GET /events  
Returns all events.

### 4.2 GET /events/:id  
Returns a single event.

### 4.3 POST /events  
Creates an event.

Minimal required fields:
- title  
- start_time  
- organizer_id  

### 4.4 PUT /events/:id  
Updates an event (full update).

### 4.5 DELETE /events/:id  
Deletes an event.

---

## 5. Registration API

### 5.1 GET /registrations  
Optional filters: `user_id`, `event_id`.

### 5.2 POST /registrations  
Creates a registration.  
Required: `user_id`, `event_id`.

### 5.3 PUT /registrations/:id  
Updates registration status (e.g., cancel).

---

## 6. How to Run (Local Development)

### Start backend + DB:

```bash
docker compose up --build
```

Wait until:

```
UniConn backend listening on port 3000
Database connected at: ...
```

### Test endpoints:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/events
curl http://localhost:3000/events/1
```

---

## 7. Database Schema

From `init.sql`:

### users
- id  
- name  
- email  

### events
- id  
- title  
- description  
- faculty  
- event_type  
- start_time  
- end_time  
- location  
- organizer_id  

### registrations
- id  
- user_id  
- event_id  
- status  
- created_at  

---

## 8. Summary

This backend provides the minimum required endpoints for the UConnect project, following the lecture slide coding style and the simplest possible implementation.
