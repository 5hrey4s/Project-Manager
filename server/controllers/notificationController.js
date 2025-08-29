const pool = require('../config/db');

// Get all notifications for the logged-in user
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await pool.query(
            `SELECT n.*, s.username as sender_username, s.avatar_url as sender_avatar
             FROM notifications n
             LEFT JOIN users s ON n.sender_id = s.id
             WHERE n.recipient_id = $1
             ORDER BY n.created_at DESC`,
            [userId]
        );
        res.json(notifications.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Mark all notifications as read for the logged-in user
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE recipient_id = $1 AND is_read = FALSE',
            [userId]
        );
        res.status(200).json({ msg: 'All notifications marked as read' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};