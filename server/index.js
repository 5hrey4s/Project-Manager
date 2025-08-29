const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');
const passport = require('passport'); // <<< ADD THIS

// --- Create server and app instances ---
const app = express();
const server = http.createServer(app);

// --- 1. Initialize Socket.io with proper CORS configuration ---
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000", // Fallback for local dev
        methods: ["GET", "POST"]
    }
});

// --- 2. Export the 'io' instance IMMEDIATELY ---
// This is the critical fix. It makes 'io' available for other files to import.
module.exports.io = io;

// --- 3. Import API routes AFTER 'io' is exported ---
// Now, when these routes (and their controllers) are loaded, they can successfully import 'io'.
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const aiRoutes = require('./routes/ai');
const authRoutes = require('./routes/auth'); // <<< ADD THIS
const notificationRoutes = require('./routes/notifications'); // <<< ADD THIS
require('./config/passport'); // <<< ADD THIS to run the passport config code

// --- Middleware ---
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(express.json());
app.use(passport.initialize()); // <<< ADD THIS to initialize passport

// --- 4. Register API Routes ---
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes); // <<< ADD THIS to use the new auth routes
app.use('/api/notifications', notificationRoutes); // <<< ADD THIS

// --- Socket.io Connection Logic ---
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
  // Get the user ID from the handshake query (the frontend will need to send this)
  const { userId } = socket.handshake.query;
  if (userId) {
    // Each user joins a room named after their own ID
    // This allows us to send notifications directly to a specific user
    socket.join(`user-${userId}`);
    console.log(`User ${socket.id} (User ID: ${userId}) connected and joined their room.`);
  }
    socket.on('join_project', (projectId) => {
        socket.join(projectId);
        console.log(`User ${socket.id} joined project room: ${projectId}`);
    });

    socket.on('leave_project', (projectId) => {
        socket.leave(projectId);
        console.log(`User ${socket.id} left project room: ${projectId}`);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// --- Start the Server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));