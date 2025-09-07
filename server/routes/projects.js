const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/auth');
const taskController = require('../controllers/taskController');


// All routes in this file are protected and require a token
router.use(authMiddleware);

// POST /api/projects - Create a new project
router.post('/', projectController.createProject);

// GET /api/projects - Get all projects for the logged-in user
router.get('/', projectController.getUserProjects);

// GET /api/projects/:projectId - Get details for a single project
router.get('/:projectId', projectController.getProjectById);

// GET /api/projects/:projectId/members - Get all members of a project
router.get('/:projectId/members', projectController.getProjectMembers);

// GET /api/projects/:projectId/tasks - Get all tasks for a project
router.get('/:projectId/tasks', taskController.getTasksForProject);

// DELETE /api/projects/:projectId - Delete a project
router.delete('/:projectId', authMiddleware, projectController.deleteProject);


// --- UPDATE: Change this route to use the new controller function ---
// @route   POST api/projects/:projectId/invitations
// @desc    Invite a user to a project
// @access  Private (Owner only)
router.post('/:projectId/invitations', authMiddleware, projectController.inviteProjectMember);


module.exports = router;