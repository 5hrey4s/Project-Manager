const pool = require('../config/db');
const { io } = require('../index'); // Import the io instance

/**
 * Creates a notification and emits a real-time event.
 * @param {object} notificationData - The data for the notification.
 * @param {number} notificationData.recipient_id - The ID of the user to notify.
 * @param {number|null} notificationData.sender_id - The ID of the user who triggered the event.
 * @param {string} notificationData.type - The type of notification (e.g., 'task_assigned').
 * @param {string} notificationData.content - The notification message.
 * @param {number|null} notificationData.project_id - The associated project ID.
 * @param {number|null} notificationData.task_id - The associated task ID.
 */
const createNotification = async (notificationData) => {
    const {
        recipient_id,
        sender_id,
        type,
        content,
        project_id,
        task_id
    } = notificationData;

    try {
        const query = `
            INSERT INTO notifications (recipient_id, sender_id, type, content, project_id, task_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const result = await pool.query(query, [recipient_id, sender_id, type, content, project_id, task_id]);
        const newNotification = result.rows[0];

        // Emit a real-time event to the specific recipient
        // We need a way to map user IDs to socket IDs. For now, we'll join users to a room named after their user ID.
        io.to(`user-${recipient_id}`).emit('new_notification', newNotification);

        return newNotification;
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

module.exports = { createNotification };