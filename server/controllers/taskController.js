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

exports.getTaskDetails = async (req, res) => {
    try {
        const { taskId } = req.params;

        // We'll run all our queries in parallel for maximum efficiency
        const [taskResult, commentsResult, attachmentsResult, labelsResult] = await Promise.all([
            // Query 1: Get the main task details and assignee info
            pool.query(`
                SELECT t.*, u.username as assignee_name 
                FROM tasks t 
                LEFT JOIN users u ON t.assignee_id = u.id 
                WHERE t.id = $1
            `, [taskId]),

            // Query 2: Get all comments for the task, with author info
            pool.query(`
                SELECT c.id, c.content, c.created_at, u.username as author_name 
                FROM comments c 
                JOIN users u ON c.user_id = u.id 
                WHERE c.task_id = $1 
                ORDER BY c.created_at ASC
            `, [taskId]),

            // Query 3: Get all attachments for the task
            pool.query('SELECT * FROM attachments WHERE task_id = $1', [taskId]),

            // Query 4: Get all labels for the task
            pool.query(`
                SELECT l.id, l.name, l.color 
                FROM labels l 
                JOIN task_labels tl ON l.id = tl.label_id 
                WHERE tl.task_id = $1
            `, [taskId])
        ]);

        if (taskResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        // Assemble the final JSON object
        const taskDetails = {
            ...taskResult.rows[0],
            comments: commentsResult.rows,
            attachments: attachmentsResult.rows,
            labels: labelsResult.rows
        };

        res.json(taskDetails);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.addComment = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { content } = req.body;
        const userId = req.user.id; // From the authMiddleware

        if (!content || content.trim() === '') {
            return res.status(400).json({ msg: 'Comment content cannot be empty.' });
        }

        // Insert the new comment and retrieve it along with the author's username
        const newCommentQuery = `
            WITH inserted_comment AS (
                INSERT INTO comments (task_id, user_id, content)
                VALUES ($1, $2, $3)
                RETURNING id, content, task_id, user_id, created_at
            )
            SELECT 
                ic.id, 
                ic.content, 
                ic.created_at, 
                u.username as author_name
            FROM inserted_comment ic
            JOIN users u ON ic.user_id = u.id;
        `;

        const result = await pool.query(newCommentQuery, [taskId, userId, content]);
        const newComment = result.rows[0];

        // --- Real-time Logic ---
        // 1. Get the project_id this task belongs to
        const taskProjectResult = await pool.query('SELECT project_id FROM tasks WHERE id = $1', [taskId]);
        if (taskProjectResult.rows.length === 0) {
            // This case is unlikely but good for robustness
            return res.status(404).json({ msg: "Task not found to associate the comment with." });
        }
        const projectId = taskProjectResult.rows[0].project_id;

        // 2. Emit a WebSocket event to the specific project's "room"
        // This sends the new comment data to all connected clients in that project
        io.to(`project-${projectId}`).emit('new_comment', {
            taskId: parseInt(taskId, 10),
            comment: newComment
        });

        // Respond to the original request with the new comment data
        res.status(201).json(newComment);

    } catch (err) {
        console.error('Error adding comment:', err.message);
        res.status(500).send('Server Error');
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        // Optional: Add a check to ensure the user is a member of the project before deleting
        // For now, we assume the frontend controls access.

        await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);

        // --- Real-time Logic ---
        // Notify clients that a task has been deleted
        const taskResult = await pool.query('SELECT project_id FROM tasks WHERE id = $1', [taskId]);
        if (taskResult.rows.length > 0) {
            const projectId = taskResult.rows[0].project_id;
            io.to(`project-${projectId}`).emit('task_deleted', { taskId: parseInt(taskId, 10) });
        }

        res.status(200).json({ msg: 'Task deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};