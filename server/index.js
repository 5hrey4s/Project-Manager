// server/index.js

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const auth = require('./middleware/auth');

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000; // Use port from environment or default to 5000

// --- CORRECTED CORS AND SOCKET.IO CONFIG ---
const clientURL = process.env.CLIENT_URL; // Get the Vercel URL from environment variables

app.use(cors({
    origin: clientURL
}));

const io = new Server(httpServer, {
    cors: {
        origin: clientURL,
        methods: ["GET", "POST"]
    }
});
// -----------------------------------------

// --- Middleware ---
app.use(express.json());

// --- Database Connection Setup ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// --- Real-Time Logic ---
io.on('connection', (socket) => {
    socket.on('join_project', (projectId) => {
        socket.join(projectId);
    });
});

// --- API Routes (ALL CORRECTED WITH '/') ---

// Test route
app.get('/test-db', async (req, res) => { res.send("API is running.") });

// User Registration
app.post('/api/users/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ msg: 'Please enter all fields' });
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const newUser = await pool.query(
            "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email",
            [username, email, passwordHash]
        );
        res.status(201).json(newUser.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ msg: 'Username or email already exists.' });
        }
        console.error(err.message);
        res.status(500).send(`Server error: ${err.message}`);
    }
});

// User Login
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ msg: 'Please enter all fields' });
        }
        const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get Logged In User Data
app.get('/api/auth/user', auth, async (req, res) => {
    try {
        const user = await pool.query("SELECT id, username, email FROM users WHERE id = $1", [req.user.id]);
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// server/index.js

// POST /api/projects - Create a new project (Protected)
app.post('/api/projects', auth, async (req, res) => {
    try {
        const { name, description } = req.body;
        const ownerId = req.user.id;

        if (!name) {
            return res.status(400).json({ msg: 'Project name is required' });
        }

        // 1. Insert the new project into the database
        const newProjectResult = await pool.query(
            "INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *",
            [name, description || null, ownerId]
        );

        const newProject = newProjectResult.rows[0];

        // --- NEW: Add the owner to the project_members table ---
        // This ensures the creator is officially a member of their own project.
        await pool.query(
            "INSERT INTO project_members (project_id, user_id) VALUES ($1, $2)",
            [newProject.id, ownerId]
        );
        // --- End of new code ---

        // 3. Send back the newly created project
        res.status(201).json(newProject);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get all projects for a user
app.get('/api/projects', auth, async (req, res) => {
    try {
        const projects = await pool.query("SELECT * FROM projects WHERE owner_id = $1 ORDER BY created_at DESC", [req.user.id]);
        res.json(projects.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Create a new task
app.post('/api/tasks', auth, async (req, res) => {
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

// Get all tasks for a specific project
app.get('/api/projects/:projectId/tasks', auth, async (req, res) => {
    try {
        const { projectId } = req.params;
        const tasks = await pool.query("SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at ASC", [projectId]);
        res.json(tasks.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update a task's status
app.patch('/api/tasks/:taskId/status', auth, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body;
        const userId = req.user.id;
        if (!['To Do', 'In Progress', 'Done'].includes(status)) {
            return res.status(400).json({ msg: 'Invalid status value' });
        }
        const taskOwnership = await pool.query(`SELECT p.owner_id FROM tasks t JOIN projects p ON t.project_id = p.id WHERE t.id = $1`, [taskId]);
        if (taskOwnership.rows.length === 0) {
            return res.status(404).json({ msg: 'Task not found' });
        }
        if (taskOwnership.rows[0].owner_id !== userId) {
            return res.status(403).json({ msg: 'Authorization denied' });
        }
        const updatedTaskResult = await pool.query("UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *", [status, taskId]);
        if (updatedTaskResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Task not found' });
        }
        const updatedTask = updatedTaskResult.rows[0];
        io.to(updatedTask.project_id.toString()).emit('task_updated', updatedTask);
        res.json(updatedTask);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/projects/:projectId/members - Add a user to a project (Invite)
app.post('/api/projects/:projectId/members', auth, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { email } = req.body; // The email of the user to invite
        const inviterId = req.user.id; // The person making the request

        // 1. Find the user to invite by their email
        const userToInviteResult = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
        if (userToInviteResult.rows.length === 0) {
            return res.status(404).json({ msg: 'User with that email does not exist.' });
        }
        const userToInviteId = userToInviteResult.rows[0].id;

        // 2. Security Check: Verify that the person making the request is the project owner
        const projectResult = await pool.query("SELECT owner_id FROM projects WHERE id = $1", [projectId]);
        if (projectResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Project not found.' });
        }

        if (projectResult.rows[0].owner_id !== inviterId) {
            return res.status(403).json({ msg: 'Forbidden: Only the project owner can invite members.' });
        }

        // 3. Add the new user to the project_members table
        await pool.query(
            "INSERT INTO project_members (project_id, user_id) VALUES ($1, $2)",
            [projectId, userToInviteId]
        );

        res.status(201).json({ msg: 'User successfully added to the project.' });

    } catch (err) {
        // Handle cases where the user is already a member (unique constraint violation)
        if (err.code === '23505') {
            return res.status(400).json({ msg: 'User is already a member of this project.' });
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});



// GET /api/projects/:projectId/members - Get all members of a project
app.get('/api/projects/:projectId/members', auth, async (req, res) => {
    try {
        // --- FIX: Convert both IDs to integers ---
        const projectId = parseInt(req.params.projectId, 10);
        const userId = parseInt(req.user.id, 10);

        // Security Check: This query will now work correctly
        const memberCheck = await pool.query(
            "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2",
            [projectId, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ msg: 'Forbidden: You are not a member of this project.' });
        }

        // Fetch all members for the project
        const members = await pool.query(
            `SELECT u.id, u.username 
             FROM users u
             JOIN project_members pm ON u.id = pm.user_id
             WHERE pm.project_id = $1`,
            [projectId]
        );

        res.json(members.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// PATCH /api/tasks/:taskId/assign - Assign a task to a user
app.patch('/api/tasks/:taskId/assign', auth, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { assigneeId } = req.body; // This can be a user ID or null (to unassign)
        const requesterId = req.user.id;

        // Security Check 1: Verify the user making the request is a member of the project
        const taskProjectQuery = await pool.query("SELECT project_id FROM tasks WHERE id = $1", [taskId]);
        if (taskProjectQuery.rows.length === 0) {
            return res.status(404).json({ msg: 'Task not found.' });
        }
        const projectId = taskProjectQuery.rows[0].project_id;

        const memberCheck = await pool.query(
            "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2",
            [projectId, requesterId]
        );
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ msg: 'Forbidden: You are not a member of this project.' });
        }

        // Security Check 2: If assigning, verify the assignee is also a member of the project
        if (assigneeId !== null) {
            const assigneeCheck = await pool.query(
                "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2",
                [projectId, assigneeId]
            );
            if (assigneeCheck.rows.length === 0) {
                return res.status(400).json({ msg: 'Cannot assign task to a user who is not a project member.' });
            }
        }

        // Update the task with the new assignee
        const updatedTaskResult = await pool.query(
            "UPDATE tasks SET assignee_id = $1 WHERE id = $2 RETURNING *",
            [assigneeId, taskId]
        );

        const updatedTask = updatedTaskResult.rows[0];

        // Broadcast the update in real-time
        io.to(updatedTask.project_id.toString()).emit('task_updated', updatedTask);

        res.json(updatedTask);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// Start the server
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});