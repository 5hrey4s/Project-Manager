const pool = require('../config/db');
const { io } = require('../index'); // We need to import io to emit events
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
        const { title, projectId, status } = req.body;

        const newTaskQuery = `
            INSERT INTO tasks (title, project_id, status) 
            VALUES ($1, $2, $3) 
            RETURNING id, title, status, assignee_id, project_id;
        `;

        const result = await pool.query(newTaskQuery, [title, projectId, status]);
        const newTask = result.rows[0];

        // Real-time broadcast to all users in the project
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
    const userId = req.user.id;

    const currentState = await pool.query('SELECT assignee_id, project_id, title FROM tasks WHERE id = $1', [taskId]);
    if (currentState.rows.length === 0) {
      return res.status(404).json({ msg: 'Task not found' });
    }
    const { assignee_id: oldAssigneeId, project_id: projectId, title: taskTitle } = currentState.rows[0];

    const result = await pool.query(
      'UPDATE tasks SET status = $1, assignee_id = $2 WHERE id = $3 RETURNING *',
      [status, assignee_id, taskId]
    );
    const updatedTask = result.rows[0];

    if (assignee_id && assignee_id !== oldAssigneeId) {
      if (assignee_id !== userId) {
        await createNotification({
          recipient_id: assignee_id,
          sender_id: userId,
          type: 'task_assigned',
          content: `assigned you to the task "${taskTitle}"`,
          project_id: projectId,
          task_id: parseInt(taskId, 10),
        });
      }
    }

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
        JOIN users u ON c.author_id = u.id 
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
    const userId = req.user.id;

    // *** FIX: Changed column from author_id to user_id to match schema ***
    const result = await pool.query(
      'INSERT INTO comments (task_id, author_id, content) VALUES ($1, $2, $3) RETURNING *',
      [taskId, userId, content]
    );
    const newCommentData = result.rows[0];

    const authorInfo = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
    const authorName = authorInfo.rows[0].username;

    const taskInfo = await pool.query('SELECT project_id, title FROM tasks WHERE id = $1', [taskId]);
    const { project_id: projectId, title: taskTitle } = taskInfo.rows[0];

    const commentForSocket = {
      id: newCommentData.id,
      content: newCommentData.content,
      created_at: newCommentData.created_at,
      author_name: authorName
    };

    const mentions = content.match(/@(\w+)/g);
    if (mentions) {
      const mentionedUsernames = [...new Set(mentions.map(m => m.substring(1)))];
      const usersResult = await pool.query(
        'SELECT id FROM users WHERE username = ANY($1::text[])',
        [mentionedUsernames]
      );

      for (const user of usersResult.rows) {
        if (user.id !== userId) {
          await createNotification({
            recipient_id: user.id,
            sender_id: userId,
            type: 'comment_mention',
            content: `mentioned you in a comment on "${taskTitle}"`,
            project_id: projectId,
            task_id: parseInt(taskId, 10),
          });
        }
      }
    }

    io.to(`project-${projectId}`).emit('new_comment', { taskId: parseInt(taskId, 10), comment: commentForSocket });
    res.status(201).json(commentForSocket);
  } catch (err) {
    console.error(err.message);
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

        // Real-time broadcast of the deletion
        io.to(`project-${project_id}`).emit('task_deleted', { taskId: parseInt(taskId, 10), projectId: project_id });

        res.status(200).json({ msg: 'Task deleted successfully' });
    } catch (err) {
        console.error('Error deleting task:', err.message);
        res.status(500).send('Server Error');
    }
};