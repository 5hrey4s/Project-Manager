const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth');

// Protect all AI routes
router.use(authMiddleware);

// POST /api/ai/generate-tasks
router.post('/generate-tasks', aiController.generateTasks);

// POST /api/ai/copilot
router.post('/copilot', aiController.copilot);

module.exports = router;