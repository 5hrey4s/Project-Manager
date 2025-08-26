const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/auth');

// Protect all task routes
router.use(authMiddleware);

// POST /api/tasks - Create a new task
router.post('/', taskController.createTask);

// GET /api/projects/:projectId/tasks - Get tasks for a project
// Note: We'll place this in projects.js for better REST structure

// PATCH /api/tasks/:taskId/status - Update task status
router.patch('/:taskId/status', taskController.updateTaskStatus);

// PATCH /api/tasks/:taskId/assign - Assign a task
router.patch('/:taskId/assign', taskController.assignTask);

// GET /api/tasks/:taskId/details - Get all details for a single task
router.get('/:taskId/details', taskController.getTaskDetails);

// POST /api/tasks/:taskId/comments - Add a new comment to a task
router.post('/:taskId/comments', authMiddleware, taskController.addComment);

module.exports = router;