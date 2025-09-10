const express = require('express');
const router = express.Router();
const attachmentController = require('../controllers/attachmentController');
const auth = require('../middleware/auth');

// Get a presigned URL for uploading a file to a specific task
router.post('/presigned-url/tasks/:taskId', auth, attachmentController.getPresignedUrl);

// Add the attachment metadata record to our database after successful upload
router.post('/record/tasks/:taskId', auth, attachmentController.addAttachmentRecord);

// Delete an attachment by its ID
router.delete('/:attachmentId', auth, attachmentController.deleteAttachment);

module.exports = router;