# Advanced Features Documentation

This document describes the implementation and testing procedures for the advanced features: **Automated Notifications** and **Real-Time Functionality**.

## Table of Contents

1. [Automated Notifications (SendGrid)](#automated-notifications-sendgrid)
2. [Real-Time Functionality (WebSocket)](#real-time-functionality-websocket)

---

## Automated Notifications (SendGrid)

### Overview

The Automated Notifications feature uses SendGrid to send email confirmations when users create or update RSVPs, and can be extended to send event reminders and other notifications.

### Implementation Details

- **Service**: SendGrid Email API
- **Dependencies**: `@sendgrid/mail` package
- **Configuration**: 
  - `SENDGRID_API_KEY`: Your SendGrid API key
  - `SENDGRID_FROM_EMAIL`: Verified sender email address
- **Location**: `src/services/notificationService.js`

### Features

- **RSVP Confirmations**: Automatically sends email when users create or update RSVP status
- **Event Notifications**: Framework in place for event creation/update notifications (currently logs to console)

### Testing

#### Local Testing (Docker Compose)

1. **Setup Environment Variables**

   Create or update `.env` file in the project root:
   ```bash
   SENDGRID_API_KEY=your_sendgrid_api_key_here
   SENDGRID_FROM_EMAIL=your_verified_email@example.com
   ```

2. **Start Services**

   ```bash
   ./localcompose.sh
   # or
   docker-compose up --build -d
   ```

3. **Test RSVP Notification**

   - Register/Login a user via `/api/auth/register` or `/api/auth/login`
   - Get an event ID from `/api/events`
   - Create an RSVP:
     ```bash
     POST http://localhost:8080/api/events/{eventId}/rsvps
     Authorization: Bearer <token>
     Content-Type: application/json
     
     {
       "status": "going"
     }
     ```
   - Check the API logs:
     ```bash
     docker logs ece1779_project-api-1 --tail 20
     ```
   - Look for: `[notification] Email sent to <email>: RSVP Confirmed: <event_title>`
   - Verify the email was received in the user's inbox

4. **Verify SendGrid Activity**

   - Log into SendGrid dashboard
   - Navigate to Activity → Email Activity
   - Check for recent email sends

#### DigitalOcean Droplet Testing

1. **Set Environment Variables**

   In your Docker Swarm stack file or environment configuration:
   ```yaml
   environment:
     SENDGRID_API_KEY: ${SENDGRID_API_KEY}
     SENDGRID_FROM_EMAIL: ${SENDGRID_FROM_EMAIL}
   ```

2. **Deploy Stack**

   ```bash
   docker stack deploy -c docker-stack.yaml uniconn
   ```

3. **Test via API**

   Use the same API endpoints as local testing, but replace `localhost:8080` with your droplet's IP or domain.

4. **Check Logs**

   ```bash
   docker service logs uniconn_api --tail 50
   ```

5. **Verify Email Delivery**

   - Check SendGrid dashboard for delivery status
   - Verify recipient received the email

### Troubleshooting

- **Email not sending**: 
  - Verify `SENDGRID_API_KEY` is correct and has proper permissions
  - Ensure `SENDGRID_FROM_EMAIL` is verified in SendGrid
  - Check API logs for error messages

- **No logs**: 
  - Verify environment variables are set correctly
  - Check container logs: `docker logs <container_name>`

---

## Real-Time Functionality (WebSocket)

### Overview

The Real-Time Functionality uses WebSocket (via Socket.IO) to provide live updates for user actions such as event creation, RSVP updates, and comment creation. This enables real-time synchronization across multiple clients without polling.

### Implementation Details

- **Technology**: Socket.IO (WebSocket library)
- **Dependencies**: `socket.io` package
- **Location**: `src/services/websocket.js`
- **Port**: Uses the same port as HTTP server (default: 8080)

### Features

- **Event Updates**: Real-time broadcasts when events are created, updated, or deleted
- **RSVP Updates**: Live updates when users create or modify RSVPs
- **Comment Updates**: Real-time notifications when new comments are posted
- **Room-based Updates**: Clients can join event-specific rooms for targeted updates

### WebSocket Events

#### Events Broadcast by Server

- `event:created` - New event created
  ```json
  { "event": { "id": 1, "title": "...", ... } }
  ```

- `event:updated` - Event updated
  ```json
  { "event": { "id": 1, "title": "...", ... } }
  ```

- `event:deleted` - Event deleted
  ```json
  { "eventId": 1 }
  ```

- `rsvp:updated` - RSVP created or updated
  ```json
  { "rsvp": { "id": 1, "status": "going", ... }, "eventId": 1 }
  ```

- `comment:created` - New comment posted
  ```json
  { "comment": { "id": 1, "body": "...", ... }, "eventId": 1 }
  ```

#### Events Sent by Client

- `join-event` - Join a specific event room
  ```javascript
  socket.emit('join-event', eventId);
  ```

- `leave-event` - Leave an event room
  ```javascript
  socket.emit('leave-event', eventId);
  ```

### Testing

#### Local Testing (Docker Compose)

1. **Start Services**

   ```bash
   ./localcompose.sh
   # or
   docker-compose up --build -d
   ```

2. **Verify WebSocket Server Started**

   Check API logs:
   ```bash
   docker logs ece1779_project-api-1 --tail 10
   ```
   Look for: `[websocket] WebSocket server initialized`

3. **Test with Browser Console**

   Open browser console on any page and run:
   ```javascript
   // Load Socket.IO client (if not already loaded)
   const script = document.createElement('script');
   script.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js';
   document.head.appendChild(script);
   
   // Wait for script to load, then connect
   script.onload = () => {
     const socket = io('http://localhost:8080');
     
     socket.on('connect', () => {
       console.log('Connected! Socket ID:', socket.id);
     });
     
     // Listen for RSVP updates
     socket.on('rsvp:updated', (data) => {
       console.log('RSVP Updated:', data);
     });
     
     // Listen for comments
     socket.on('comment:created', (data) => {
       console.log('New Comment:', data);
     });
     
     // Listen for event updates
     socket.on('event:created', (data) => {
       console.log('New Event:', data);
     });
     
     socket.on('event:updated', (data) => {
       console.log('Event Updated:', data);
     });
     
     // Join a specific event room
     socket.emit('join-event', 1);
   };
   ```

4. **Trigger Updates via API**

   In another terminal or using a REST client:
   
   - **Create RSVP** (triggers `rsvp:updated`):
     ```bash
     POST http://localhost:8080/api/events/1/rsvps
     Authorization: Bearer <token>
     Content-Type: application/json
     
     { "status": "going" }
     ```
   
   - **Create Comment** (triggers `comment:created`):
     ```bash
     POST http://localhost:8080/api/events/1/comments
     Authorization: Bearer <token>
     Content-Type: application/json
     
     { "body": "Test comment" }
     ```
   
   - **Create Event** (triggers `event:created`):
     ```bash
     POST http://localhost:8080/api/events
     Authorization: Bearer <token> (organizer/admin)
     Content-Type: application/json
     
     {
       "title": "Test Event",
       "description": "Testing WebSocket",
       "location": "Test Location",
       "faculty": "Engineering",
       "category": "test",
       "start_time": "2025-01-20T10:00:00Z",
       "end_time": "2025-01-20T12:00:00Z"
     }
     ```

5. **Verify Broadcasts**

   - Check browser console for real-time messages
   - Check API logs for broadcast confirmations:
     ```bash
     docker logs ece1779_project-api-1 --tail 20 | grep websocket
     ```
   - Look for: `[websocket] Broadcasted <event_type> for event <id>`

#### DigitalOcean Droplet Testing

1. **Deploy Stack**

   ```bash
   docker stack deploy -c docker-stack.yaml uniconn
   ```

2. **Verify WebSocket Server**

   Check service logs:
   ```bash
   docker service logs uniconn_api --tail 20
   ```
   Look for: `[websocket] WebSocket server initialized`

3. **Test with Browser Console**

   Replace `localhost:8080` with your droplet's IP or domain:
   ```javascript
   const socket = io('http://your-droplet-ip:8080');
   // or
   const socket = io('https://your-domain.com');
   ```

4. **Test via API**

   Use the same API endpoints as local testing, but with your droplet's address.

5. **Verify Real-Time Updates**

   - Open multiple browser tabs/windows
   - Connect to WebSocket in each
   - Perform actions in one tab
   - Verify updates appear in other tabs in real-time

### Troubleshooting

- **WebSocket not connecting**:
  - Verify server is running: `docker ps` or `docker service ls`
  - Check firewall rules allow WebSocket connections
  - Ensure port 8080 (or configured port) is accessible
  - Check CORS settings if connecting from different origin

- **No real-time updates**:
  - Verify WebSocket connection is established (check browser console)
  - Check API logs for broadcast messages
  - Ensure you're listening to the correct event names
  - Verify the action was successful (check HTTP response)

- **Connection issues on DigitalOcean**:
  - Check Traefik configuration for WebSocket support
  - Verify load balancer/proxy settings allow WebSocket upgrades
  - Check network policies and security groups

### Integration Notes

- **Traefik Configuration**: If using Traefik as reverse proxy, ensure WebSocket support is enabled:
  ```yaml
  labels:
    - "traefik.http.services.api.loadbalancer.server.port=8080"
    - "traefik.http.routers.api.rule=Host(`your-domain.com`)"
    - "traefik.http.routers.api.entrypoints=web"
    - "traefik.http.services.api.loadbalancer.server.scheme=http"
  ```

- **CORS**: WebSocket CORS is configured in `websocket.js`. Adjust `origin` settings for production.

- **Authentication**: Currently WebSocket connections are open. For production, consider adding authentication middleware.

---

## Summary

Both features are fully implemented and tested:

- **Automated Notifications**: Sends email confirmations via SendGrid when RSVPs are created/updated
- **Real-Time Functionality**: Provides live updates via WebSocket for events, RSVPs, and comments

For questions or issues, check the API logs and verify environment variables are correctly configured.

