const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs'); // Import bcryptjs
const cors = require('cors'); // Import cors
const jwt = require('jsonwebtoken');
require('dotenv').config();
const auth = require('./middleware/auth');
const { createServer } = require('http'); // Import Node's built-in http module
const { Server } = require('socket.io'); // Import the Server class from socket.io



const app = express();
const httpServer = createServer(app); // Create an HTTP server from your Express app
const io = new Server(httpServer, { // Initialize Socket.IO and attach it to the server
    cors: {
        origin: "http://localhost:3000", // Allow connections from your frontend
        methods: ["GET", "POST"]
    }
});

const PORT = 5000;


// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Allow server to accept and parse JSON in request bodies

// --- Real-Time Logic ---
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Listen for a client joining a specific project's room
    socket.on('join_project', (projectId) => {
        socket.join(projectId);
        console.log(`User ${socket.id} joined project room: ${projectId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// --- Database Connection Setup ---
// const pool = new Pool({
//     user: process.env.POSTGRESS_USERNAME,
//     host: process.env.DB_HOST,
//     database: process.env.DB_DATABASE,
//     password: process.env.POSTGRESS_PASSWORD,
//     port: process.env.DB_PORT,
// });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    // This is the crucial part for production databases
    ssl: {
        rejectUnauthorized: false
    }
});

// --- API Routes ---

// Test route (you can keep or remove this)
app.get('test-db', async (req, res) => { /* ... */ });

// POST /api/users/register - New User Registration
app.post('api/users/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 1. Basic Validation
        if (!username || !email || !password) {
            return res.status(400).json({ msg: 'Please enter all fields' });
        }

        // 2. Hash the password
        const salt = await bcrypt.genSalt(10); // Generate a "salt" for hashing
        const passwordHash = await bcrypt.hash(password, salt); // Now hash the password

        // 3. Insert the new user into the database
        const newUser = await pool.query(
            "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email",
            [username, email, passwordHash]
        );

        // 4. Send back a success response
        res.status(201).json(newUser.rows[0]);

    } catch (err) {
        // Check for unique constraint violation (duplicate email/username)
        if (err.code === '23505') {
            return res.status(400).json({ msg: 'Username or email already exists.' });
        }
        console.error(err.message);
        res.status(500).send(`Server error:${err}`);
    }
});

// POST /api/users/login - User Login
app.post('api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Basic Validation
        if (!email || !password) {
            return res.status(400).json({ msg: 'Please enter all fields' });
        }

        // 2. Check if user exists
        const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
        const user = userResult.rows[0];

        // 3. Compare the provided password with the stored hash
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // 4. User is validated, create JWT Payload
        const payload = {
            user: {
                id: user.id, // Include user ID in the token
            },
        };

        // 5. Sign the token
        jwt.sign(
            payload,
            process.env.JWT_SECRET, // A secret key for signing
            { expiresIn: 3600 }, // Token expires in 1 hour
            (err, token) => {
                if (err) throw err;
                res.json({ token }); // Send the token to the client
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// GET /api/auth/user - Get Logged In User Data (Protected)
// The 'auth' middleware will run before the main (req, res) function
app.get('api/auth/user', auth, async (req, res) => {
    try {
        // The user's id is available in req.user.id from the auth middleware
        const user = await pool.query("SELECT id, username, email FROM users WHERE id = $1", [req.user.id]);
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/projects - Create a new project (Protected)
app.post('api/projects', auth, async (req, res) => {
    try {
        const { name, description } = req.body;
        const ownerId = req.user.id; // Get the user's ID from the auth middleware

        // 1. Basic Validation
        if (!name) {
            return res.status(400).json({ msg: 'Project name is required' });
        }

        // 2. Insert the new project into the database
        const newProject = await pool.query(
            "INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *",
            [name, description || null, ownerId]
        );

        // 3. Send back the newly created project
        res.status(201).json(newProject.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/projects - Get all projects for a user (Protected)
app.get('api/projects', auth, async (req, res) => {
    try {
        const projects = await pool.query(
            "SELECT * FROM projects WHERE owner_id = $1 ORDER BY created_at DESC",
            [req.user.id]
        );

        res.json(projects.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/tasks - Create a new task for a project (Protected)
app.post('api/tasks', auth, async (req, res) => {
    try {
        const { title, projectId } = req.body;
        if (!title || !projectId) {
            return res.status(400).json({ msg: 'Title and Project ID are required' });
        }

        const newTask = await pool.query(
            "INSERT INTO tasks (title, project_id) VALUES ($1, $2) RETURNING *",
            [title, projectId]
        );

        res.status(201).json(newTask.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/projects/:id/tasks - Get all tasks for a specific project (Protected)
app.get('api/projects/:projectId/tasks', auth, async (req, res) => {
    try {
        const { projectId } = req.params;
        const tasks = await pool.query(
            "SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at ASC",
            [projectId]
        );
        res.json(tasks.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// PATCH /api/tasks/:id/status - Update a task's status (Protected)
app.patch('api/tasks/:taskId/status', auth, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body;
        const userId = req.user.id;

        if (!['To Do', 'In Progress', 'Done'].includes(status)) {
            return res.status(400).json({ msg: 'Invalid status value' });
        }

        const taskOwnership = await pool.query(
            `SELECT p.owner_id 
             FROM tasks t 
             JOIN projects p ON t.project_id = p.id 
             WHERE t.id = $1`,
            [taskId]
        );

        if (taskOwnership.rows.length === 0) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        if (taskOwnership.rows[0].owner_id !== userId) {
            return res.status(403).json({ msg: 'Authorization denied: You do not own this project' });
        }

        // --- FIX STARTS HERE ---

        // 1. Store the query result in a new variable, e.g., 'updatedTaskResult'
        const updatedTaskResult = await pool.query(
            "UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *",
            [status, taskId]
        );

        // 2. Check if the update was successful BEFORE proceeding
        if (updatedTaskResult.rows.length === 0) {
            // This case is unlikely if the ownership check passed, but it's good practice
            return res.status(404).json({ msg: 'Task not found after update attempt' });
        }

        // 3. Extract the actual task object from the 'rows' array
        const updatedTask = updatedTaskResult.rows[0];

        // 4. Now, use the correct 'updatedTask' object for your real-time event
        io.to(updatedTask.project_id.toString()).emit('task_updated', updatedTask);

        // 5. And send the correct 'updatedTask' object in the response
        res.json(updatedTask);

        // --- FIX ENDS HERE ---

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });
httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});