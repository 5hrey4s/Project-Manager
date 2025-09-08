// server/services/notificationService.js
const pool = require('../config/db');
const { getIO } = require('../socket');

const createNotification = async (notificationData) => {
    const {
        recipient_id,
        sender_id,
        type,
        content,
        project_id,
        task_id
    } = notificationData;

    const io = getIO();

    try {
        const query = `
          INSERT INTO notifications (recipient_id, sender_id, type, content, project_id, task_id)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *;
        `;
        const result = await pool.query(query, [recipient_id, sender_id, type, content, project_id, task_id]);
        const newNotification = result.rows[0];

        if (io) {
            io.to(`user-${recipient_id}`).emit('new_notification', newNotification);
        }

        return newNotification;
    } catch (error) {
        console.error('Error creating notification:', error.message);
    }
};

module.exports = { createNotification };