// server/index.js
const express = require('express');
const http = require('http');
const cors = require('cors');
require('dotenv').config();
const passport = require('passport');
const { initSocket } = require('./socket'); // <-- IMPORT from the new helper

// --- Create server and app instances ---
const app = express();
const server = http.createServer(app);

// --- CORS Configuration ---
const allowedOrigins = [
    'http://localhost:3000',
    'https://project-manager-r2wc.vercel.app'
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};

// --- Initialize Socket.io using the new helper ---
const io = initSocket(server, corsOptions);

// --- Import Routes & Passport Config ---
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const aiRoutes = require('./routes/ai');
const authRoutes = require('./routes/auth');
const notificationRoutes = require('./routes/notifications');
const invitationRoutes = require('./routes/invitations');
const attachmentRoutes = require('./routes/attachments'); // Import the new routes

require('./config/passport');

// --- Middleware ---
app.use(cors(corsOptions));
app.use(express.json());
app.use(passport.initialize());

// --- Register API Routes ---
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/attachments', attachmentRoutes); // Use the new routes

// --- Socket.io Connection Logic ---
io.on('connection', (socket) => {
    const { userId } = socket.handshake.query;
    if (userId) {
        socket.join(`user-${userId}`);
        console.log(`User ${socket.id} (User ID: ${userId}) connected and joined their room.`);
    }

    socket.on('join_project', (projectId) => {
        socket.join(`project-${projectId}`);
        console.log(`User ${socket.id} joined project room: project-${projectId}`);
    });

    socket.on('disconnect', () => {
        console.log(`User ${socket.id} disconnected`);
    });
});

// --- Start the Server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));