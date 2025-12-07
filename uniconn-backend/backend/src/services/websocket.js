// ============================================================
// WEBSOCKET SERVICE — STABLE FINAL VERSION
// ============================================================

let io = null;

// Track users in each room for participant count
const roomParticipants = new Map();

function getRoomCount(eventId) {
  const room = `event:${eventId}`;
  return roomParticipants.get(room)?.size || 0;
}

function initializeWebSocket(server) {
  const { Server } = require("socket.io");

  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log(`[websocket] Client connected: ${socket.id}`);

    // =======================================================
    // JOIN EVENT ROOM
    // =======================================================
    socket.on("join-event", ({ eventId, user }) => {
      if (!eventId) return console.log(" join-event missing eventId");

      const room = `event:${eventId}`;
      socket.join(room);
      
      // Track participant
      if (!roomParticipants.has(room)) {
        roomParticipants.set(room, new Map());
      }
      roomParticipants.get(room).set(socket.id, user);
      
      const count = roomParticipants.get(room).size;

      console.log(`[websocket] ${user?.name} joined ${room} (${count} online)`);

      // Notify room about new user and updated count
      socket.to(room).emit("user:joined", { user, eventId });
      io.to(room).emit("room:count", { eventId, count });
    });

    // =======================================================
    // LEAVE EVENT ROOM
    // =======================================================
    socket.on("leave-event", ({ eventId, user }) => {
      if (!eventId) return console.log(" leave-event missing eventId");

      const room = `event:${eventId}`;
      socket.leave(room);
      
      // Remove participant
      if (roomParticipants.has(room)) {
        roomParticipants.get(room).delete(socket.id);
        if (roomParticipants.get(room).size === 0) {
          roomParticipants.delete(room);
        }
      }
      
      const count = roomParticipants.get(room)?.size || 0;

      console.log(`[websocket] ${user?.name} left ${room} (${count} online)`);

      socket.to(room).emit("user:left", { user, eventId });
      io.to(room).emit("room:count", { eventId, count });
    });

    // =======================================================
    // CHAT MESSAGE
    // =======================================================
    socket.on("chat:send", ({ eventId, user, message }) => {
      if (!eventId) return console.log(" chat:send missing eventId");
      if (!message) return; // ignore empty messages

      const room = `event:${eventId}`;

      console.log(`[websocket] chat:send received for ${room}`);

      const msg = {
        eventId,
        user,
        message,
        ts: new Date().toISOString()
      };

      io.to(room).emit("chat:new", msg);

      console.log(`[websocket] chat:new -> ${room}`);
    });

    // =======================================================
    // TYPING INDICATOR
    // =======================================================
    socket.on("chat:typing", ({ eventId, user, stop }) => {
      if (!eventId) return;

      const room = `event:${eventId}`;

      if (stop) {
        // frontend auto-hides
        return;
      }

      socket.to(room).emit("chat:typing", user);
    });

    // =======================================================
    // DISCONNECT
    // =======================================================
    socket.on("disconnect", () => {
      console.log(`[websocket] Client disconnected: ${socket.id}`);
      
      // Clean up participant from all rooms
      for (const [room, participants] of roomParticipants.entries()) {
        if (participants.has(socket.id)) {
          const user = participants.get(socket.id);
          participants.delete(socket.id);
          
          const count = participants.size;
          const eventId = room.replace('event:', '');
          
          if (count === 0) {
            roomParticipants.delete(room);
          }
          
          // Notify room
          io.to(room).emit("user:left", { user, eventId });
          io.to(room).emit("room:count", { eventId, count });
          
          console.log(`[websocket] ${user?.name} disconnected from ${room} (${count} online)`);
        }
      }
    });
  });

  console.log("[websocket] WebSocket server initialized");
  return io;
}


// ============================================================
// BROADCAST HELPERS
// ============================================================

function getIO() {
  if (!io) throw new Error("WebSocket not initialized.");
  return io;
}

function broadcastEventCreated(event) {
  io?.emit("event:created", { event });
  console.log(`[ws] event:created ${event.id}`);
}

function broadcastEventUpdated(event) {
  io?.emit("event:updated", { event });
  io?.to(`event:${event.id}`).emit("event:updated", { event });
  console.log(`[ws] event:updated ${event.id}`);
}

function broadcastEventDeleted(eventId) {
  io?.emit("event:deleted", { eventId });
  console.log(`[ws] event:deleted ${eventId}`);
}

function broadcastRSVPUpdate(rsvp, eventId) {
  io?.emit("rsvp:updated", { rsvp, eventId });
  io?.to(`event:${eventId}`).emit("rsvp:updated", { rsvp, eventId });
  console.log(`[ws] rsvp:updated event ${eventId}`);
}

function broadcastCommentCreated(comment, eventId) {
  // Broadcast to the event room so only users viewing that event get notified
  io?.to(`event:${eventId}`).emit("comment:created", { comment, eventId });
  console.log(`[ws] comment:created event ${eventId}`);
}

function broadcastCommentDeleted(commentId, eventId) {
  // Broadcast to the event room so users see the comment disappear
  io?.to(`event:${eventId}`).emit("comment:deleted", { commentId, eventId });
  console.log(`[ws] comment:deleted ${commentId} event ${eventId}`);
}


// ============================================================
// EXPORTS
// ============================================================
module.exports = {
  initializeWebSocket,
  getIO,
  broadcastEventCreated,
  broadcastEventUpdated,
  broadcastEventDeleted,
  broadcastRSVPUpdate,
  broadcastCommentCreated,
  broadcastCommentDeleted
};
