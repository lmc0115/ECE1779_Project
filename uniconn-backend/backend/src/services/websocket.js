// WebSocket service for real-time updates
let io = null;

function initializeWebSocket(server) {
  const { Server } = require("socket.io");
  io = new Server(server, {
    cors: {
      origin: "*", // In production, specify allowed origins
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log(`[websocket] Client connected: ${socket.id}`);

    // Join event-specific room for targeted updates
    socket.on("join-event", (eventId) => {
      socket.join(`event:${eventId}`);
      console.log(`[websocket] Client ${socket.id} joined event:${eventId}`);
    });

    // Leave event room
    socket.on("leave-event", (eventId) => {
      socket.leave(`event:${eventId}`);
      console.log(`[websocket] Client ${socket.id} left event:${eventId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[websocket] Client disconnected: ${socket.id}`);
    });
  });

  console.log("[websocket] WebSocket server initialized");
  return io;
}

function getIO() {
  if (!io) {
    throw new Error("WebSocket server not initialized. Call initializeWebSocket first.");
  }
  return io;
}

// Broadcast event creation
function broadcastEventCreated(event) {
  if (!io) return;
  io.emit("event:created", { event });
  console.log(`[websocket] Broadcasted event:created for event ${event.id}`);
}

// Broadcast event update
function broadcastEventUpdated(event) {
  if (!io) return;
  io.emit("event:updated", { event });
  // Also broadcast to event-specific room
  io.to(`event:${event.id}`).emit("event:updated", { event });
  console.log(`[websocket] Broadcasted event:updated for event ${event.id}`);
}

// Broadcast event deletion
function broadcastEventDeleted(eventId) {
  if (!io) return;
  io.emit("event:deleted", { eventId });
  console.log(`[websocket] Broadcasted event:deleted for event ${eventId}`);
}

// Broadcast RSVP update
function broadcastRSVPUpdate(rsvp, eventId) {
  if (!io) return;
  io.emit("rsvp:updated", { rsvp, eventId });
  // Also broadcast to event-specific room
  io.to(`event:${eventId}`).emit("rsvp:updated", { rsvp, eventId });
  console.log(`[websocket] Broadcasted rsvp:updated for event ${eventId}`);
}

// Broadcast comment creation
function broadcastCommentCreated(comment, eventId) {
  if (!io) return;
  io.emit("comment:created", { comment, eventId });
  // Also broadcast to event-specific room
  io.to(`event:${eventId}`).emit("comment:created", { comment, eventId });
  console.log(`[websocket] Broadcasted comment:created for event ${eventId}`);
}

module.exports = {
  initializeWebSocket,
  getIO,
  broadcastEventCreated,
  broadcastEventUpdated,
  broadcastEventDeleted,
  broadcastRSVPUpdate,
  broadcastCommentCreated
};

