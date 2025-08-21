const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createServer } = require('http');
const { Server } = require('socket.io');
const pool = require('./config/db');

const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const aiRoutes = require('./routes/ai');

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST"]
    }
});

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);

io.on('connection', (socket) => {
    socket.on('join_project', (projectId) => {
        socket.join(projectId);
    });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = { app, pool, io };