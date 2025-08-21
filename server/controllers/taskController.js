const pool = require('../config/db');
const { io } = require('../index'); // We need to import io to emit events

exports.getTasksForProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        // Security check for membership is already handled in the project routes/controllers
        const tasks = await pool.query(
            "SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at ASC",
            [projectId]
        );
        res.json(tasks.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.createTask = async (req, res) => {
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
};

exports.updateTaskStatus = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body;
        // ... (Add your security checks here if needed, e.g., verify user is a member)
        const updatedTaskResult = await pool.query(
            "UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *",
            [status, taskId]
        );
        const updatedTask = updatedTaskResult.rows[0];
        io.to(updatedTask.project_id.toString()).emit('task_updated', updatedTask);
        res.json(updatedTask);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.assignTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { assigneeId } = req.body;
        // ... (Add your security checks here if needed)
        const updatedTaskResult = await pool.query(
            "UPDATE tasks SET assignee_id = $1 WHERE id = $2 RETURNING *",
            [assigneeId, taskId]
        );
        const updatedTask = updatedTaskResult.rows[0];
        io.to(updatedTask.project_id.toString()).emit('task_updated', updatedTask);
        res.json(updatedTask);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};