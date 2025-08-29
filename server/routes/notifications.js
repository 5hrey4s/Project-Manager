const router = require('express').Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/auth');

// GET /api/notifications - Get all of a user's notifications
router.get('/', authMiddleware, notificationController.getNotifications);

// PUT /api/notifications/read - Mark all notifications as read
router.put('/read', authMiddleware, notificationController.markAllAsRead);

module.exports = router;