const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const passport = require('passport');

// --- Create server and app instances ---
const app = express();
const server = http.createServer(app);

// --- FIX: Whitelist your frontend's production and development URLs ---
const allowedOrigins = [
    'http://localhost:3000',
    'https://project-manager-r2wc.vercel.app'
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
};

// --- 1. Initialize Socket.io with the same CORS options ---
const io = new Server(server, {
    cors: corsOptions
});

// --- 2. Export 'io' for other files ---
module.exports.io = io;

// --- 3. Import ALL routes & Passport config ---
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const aiRoutes = require('./routes/ai');
const authRoutes = require('./routes/auth');
const notificationRoutes = require('./routes/notifications');
const invitationRoutes = require('./routes/invitations'); // <-- ADD THIS LINE
require('./config/passport');

// --- Middleware ---
app.use(cors(corsOptions)); // <<< Use the detailed CORS options
app.use(express.json());
app.use(passport.initialize());

// --- 4. Register API Routes ---
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/invitations', invitationRoutes); // <-- AND ADD THIS LINE

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