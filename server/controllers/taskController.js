const pool = require('../config/db');
const { getIO } = require('../socket'); // <-- FIX: This line was missing
const { createNotification } = require('../services/notificationService');

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
        const { projectId, title, description, status, start_date, due_date } = req.body;
        const creatorId = req.user.id;

        if (!title || !projectId) {
            return res.status(400).json({ msg: 'Project ID and title are required.' });
        }

        const newTaskResult = await pool.query(
            `INSERT INTO tasks (project_id, title, description, status, creator_id, start_date, due_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [projectId, title, description || null, status || 'To Do', creatorId, start_date || null, due_date || null]
        );
        const newTask = newTaskResult.rows[0];

        const io = getIO();
        io.to(`project-${projectId}`).emit('task_created', newTask);

        res.status(201).json(newTask);
    } catch (err) {
        console.error('Error creating task:', err.message);
        res.status(500).send('Server Error');
    }
};




exports.updateTaskStatus = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status, assignee_id } = req.body;
        const senderId = req.user.id;

        const currentStateResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
        if (currentStateResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Task not found' });
        }
        const currentTask = currentStateResult.rows[0];

        const newStatus = status !== undefined ? status : currentTask.status;
        const newAssigneeId = assignee_id !== undefined ? assignee_id : currentTask.assignee_id;

        const result = await pool.query(
            'UPDATE tasks SET status = $1, assignee_id = $2 WHERE id = $3 RETURNING *',
            [newStatus, newAssigneeId, taskId]
        );
        const updatedTask = result.rows[0];

        // --- Notification Logic ---

        // 1. Task Assignment Notification (No changes here)
        if (newAssigneeId !== null && newAssigneeId !== currentTask.assignee_id) {
            if (newAssigneeId !== senderId) {
                await createNotification({ /* ... existing code ... */ });
            }
        }

        // --- FIX: Notify BOTH Assignee and Creator on Status Update ---
        if (newStatus !== currentTask.status) {
            const recipients = new Set(); // Use a Set to avoid sending duplicate notifications

            // Add the assignee to the list of recipients
            if (updatedTask.assignee_id && updatedTask.assignee_id !== senderId) {
                recipients.add(updatedTask.assignee_id);
            }

            // Add the task creator to the list of recipients
            if (currentTask.creator_id && currentTask.creator_id !== senderId) {
                recipients.add(currentTask.creator_id);
            }

            // Send a notification to each unique recipient
            for (const recipientId of recipients) {
                await createNotification({
                    recipient_id: recipientId,
                    sender_id: senderId,
                    type: 'task_status_updated',
                    content: `changed the status of "${currentTask.title}" to "${newStatus}"`,
                    project_id: currentTask.project_id,
                    task_id: parseInt(taskId, 10)
                });
            }
        }
        const io = getIO();

        io.to(`project-${updatedTask.project_id}`).emit('task_updated', updatedTask);
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
        const senderId = req.user.id;

        const currentState = await pool.query('SELECT project_id, title FROM tasks WHERE id = $1', [taskId]);
        if (currentState.rows.length === 0) {
            return res.status(404).json({ msg: 'Task not found' });
        }
        const { project_id: projectId, title: taskTitle } = currentState.rows[0];

        const updatedTaskResult = await pool.query(
            "UPDATE tasks SET assignee_id = $1 WHERE id = $2 RETURNING *",
            [assigneeId, taskId]
        );
        const updatedTask = updatedTaskResult.rows[0];

        // *** FIX: Added missing notification logic ***
        if (assigneeId && assigneeId !== senderId) {
            await createNotification({
                recipient_id: assigneeId,
                sender_id: senderId,
                type: 'task_assigned',
                content: `assigned you to the task "${taskTitle}"`,
                project_id: projectId,
                task_id: parseInt(taskId, 10),
            });
        }
        const io = getIO();

        io.to(`project-${updatedTask.project_id}`).emit('task_updated', updatedTask);
        res.json(updatedTask);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};


exports.getTaskDetails = async (req, res) => {
    try {
        const { taskId } = req.params;

        const [taskResult, commentsResult] = await Promise.all([
            pool.query(`
        SELECT t.*, u.username as assignee_name 
        FROM tasks t 
        LEFT JOIN users u ON t.assignee_id = u.id 
        WHERE t.id = $1
      `, [taskId]),
            // *** FIX: Correctly reference user_id and join with users table ***
            pool.query(`
        SELECT c.id, c.content, c.created_at, u.username as author_name 
        FROM comments c 
        JOIN users u ON c.user_id = u.id 
        WHERE c.task_id = $1 
        ORDER BY c.created_at ASC
      `, [taskId]),
        ]);

        if (taskResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        const taskDetails = {
            ...taskResult.rows[0],
            comments: commentsResult.rows,
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
        const senderId = req.user.id; // The person writing the comment

        const result = await pool.query(
            // Use user_id as per your original schema
            'INSERT INTO comments (task_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
            [taskId, senderId, content]
        );
        const newCommentData = result.rows[0];

        // Get necessary info for notifications and socket events
        const authorInfo = await pool.query('SELECT username FROM users WHERE id = $1', [senderId]);
        const authorName = authorInfo.rows[0].username;

        const taskInfoResult = await pool.query('SELECT project_id, title, assignee_id FROM tasks WHERE id = $1', [taskId]);
        const { project_id: projectId, title: taskTitle, assignee_id: assigneeId } = taskInfoResult.rows[0];

        const commentForSocket = {
            id: newCommentData.id,
            content: newCommentData.content,
            created_at: newCommentData.created_at,
            author_name: authorName
        };

        // --- Notification Logic ---
        const recipients = new Set();
        const mentions = content.match(/@(\w+)/g);
        if (mentions) {
            const mentionedUsernames = [...new Set(mentions.map(m => m.substring(1)))];
            const usersResult = await pool.query(
                'SELECT id FROM users WHERE username = ANY($1::text[])',
                [mentionedUsernames]
            );
            for (const user of usersResult.rows) {
                if (user.id !== senderId) {
                    recipients.add(user.id);
                }
            }
        }

        // Notify the assignee of the task, if they weren't already mentioned.
        if (assigneeId && assigneeId !== senderId && !recipients.has(assigneeId)) {
            recipients.add(assigneeId);
        }

        // Send notifications to all unique recipients
        for (const recipientId of recipients) {
            await createNotification({
                recipient_id: recipientId,
                sender_id: senderId,
                type: 'new_comment',
                content: `commented on the task "${taskTitle}"`,
                project_id: projectId,
                task_id: parseInt(taskId, 10),
            });
        }

        const io = getIO();
        // Use 'new_comment' event name as per your original code
        io.to(`project-${projectId}`).emit('new_comment', { taskId: parseInt(taskId, 10), comment: commentForSocket });

        res.status(201).json(commentForSocket);
    } catch (err) {
        console.error('Error adding comment:', err.message);
        res.status(500).send('Server Error');
    }
};


exports.deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        // First, get the project_id to notify the correct room
        const taskResult = await pool.query('SELECT project_id FROM tasks WHERE id = $1', [taskId]);
        if (taskResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Task not found' });
        }
        const { project_id } = taskResult.rows[0];

        // Delete the task
        await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
        const io = getIO();

        // Real-time broadcast of the deletion
        io.to(`project-${project_id}`).emit('task_deleted', { taskId: parseInt(taskId, 10), projectId: project_id });

        res.status(200).json({ msg: 'Task deleted successfully' });
    } catch (err) {
        console.error('Error deleting task:', err.message);
        res.status(500).send('Server Error');
    }
};

// Add this new function to the file.

exports.updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, description, status, assignee_id, priority, start_date, due_date } = req.body;
        const userId = req.user.id;

        const taskResult = await pool.query("SELECT project_id FROM tasks WHERE id = $1", [taskId]);
        if (taskResult.rows.length === 0) return res.status(404).json({ msg: 'Task not found.' });
        const projectId = taskResult.rows[0].project_id;

        const updatedTaskResult = await pool.query(
            `UPDATE tasks SET 
             title = COALESCE($1, title), description = COALESCE($2, description), 
             status = COALESCE($3, status), assignee_id = COALESCE($4, assignee_id),
             priority = COALESCE($5, priority), start_date = COALESCE($6, start_date), 
             due_date = COALESCE($7, due_date), updated_at = NOW()
             WHERE id = $8 RETURNING *`,
            [title, description, status, assignee_id, priority, start_date, due_date, taskId]
        );
        const updatedTask = updatedTaskResult.rows[0];

        const io = getIO();
        io.to(`project-${projectId}`).emit('task_updated', updatedTask);

        if (assignee_id) {
            await createNotification({
                recipient_id: assignee_id,
                sender_id: userId,
                type: 'task_assignment',
                content: `assigned you to the task "${updatedTask.title}"`,
                project_id: projectId,
                task_id: parseInt(taskId, 10)
            });
        }
        res.json(updatedTask);
    } catch (err) {
        console.error('Error updating task:', err.message);
        res.status(500).send('Server Error');
    }
};