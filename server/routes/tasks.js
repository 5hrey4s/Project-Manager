const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');

// Protect all task routes
router.use(auth);

// POST /api/tasks - Create a new task
router.post('/', taskController.createTask);

// --- THIS IS THE FIX ---
// PUT /api/tasks/:taskId - Update a task's details
router.put('/:taskId', taskController.updateTask);

// PATCH /api/tasks/:taskId/status - Update task status (for drag-and-drop)
router.patch('/:taskId/status', taskController.updateTaskStatus);

// GET /api/tasks/:taskId/details - Get all details for a single task
router.get('/:taskId/details', taskController.getTaskDetails);

// POST /api/tasks/:taskId/comments - Add a new comment to a task
router.post('/:taskId/comments', taskController.addComment);

// DELETE /api/tasks/:taskId - Soft delete a task
router.delete('/:taskId', taskController.deleteTask);

// PATCH /api/tasks/:taskId/assign - Assign a task to a user
router.patch('/:taskId/assign', auth, taskController.assignTask);


module.exports = router;