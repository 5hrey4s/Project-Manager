const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Defines the route for POST /api/users/register
router.post('/register', authController.registerUser);

// Defines the route for POST /api/users/login
router.post('/login', authController.loginUser);

// Defines the route for GET /api/users/user
router.get('/user', authMiddleware, authController.getLoggedInUser);

// GET /api/users/me/tasks - Get all tasks assigned to the logged-in user
router.get('/me/tasks', authMiddleware, authController.getMyTasks);

module.exports = router;