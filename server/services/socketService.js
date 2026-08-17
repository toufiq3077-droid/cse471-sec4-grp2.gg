const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

/**
 * Initialize Socket.io server on the HTTP server instance
 * @param {import('http').Server} httpServer
 */
function initSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  // JWT Authentication middleware for Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      // Allow unauthenticated connection or reject if strict
      return next();
    }

    try {
      const secret = process.env.JWT_SECRET || 'kheti_jwt_secret_dev_2026';
      const decoded = jwt.verify(token, secret);
      socket.user = decoded;
      return next();
    } catch (err) {
      console.warn('⚡ Socket.io JWT auth warning:', err.message);
      return next();
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user?.id || socket.user?._id;
    if (userId) {
      const room = `user_${userId}`;
      socket.join(room);
      console.log(`⚡ User ${userId} (${socket.user?.name || 'Farmer'}) connected & joined room ${room}`);
    } else {
      console.log(`⚡ Anonymous Socket connected: ${socket.id}`);
    }

    socket.on('disconnect', () => {
      // Disconnected
    });
  });

  console.log('⚡ Socket.io real-time engine initialized');
  return io;
}

/**
 * Get active Socket.io instance
 */
function getIO() {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
}

/**
 * Emit a real-time event to a specific user (or all connected sockets if userId is null)
 * @param {string|null} userId
 * @param {string} event
 * @param {object} payload
 */
function emitToUser(userId, event, payload) {
  if (!io) return;
  if (userId) {
    io.to(`user_${userId}`).emit(event, payload);
  } else {
    io.emit(event, payload);
  }
}

/**
 * Broadcast a real-time weather risk alert to all connected users or specific farmer
 */
function broadcastWeatherAlert(payload, userId = null) {
  if (!io) return;
  if (userId) {
    io.to(`user_${userId}`).emit('weather_alert', payload);
  } else {
    io.emit('weather_alert', payload);
  }
}

module.exports = {
  initSocketServer,
  getIO,
  emitToUser,
  broadcastWeatherAlert,
};
