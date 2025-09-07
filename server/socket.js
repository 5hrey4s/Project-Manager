const { Server } = require('socket.io');

let io;

function initSocket(server, corsOptions) {
  io = new Server(server, {
    cors: corsOptions,
  });
  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}

module.exports = { initSocket, getIO };