const pool = require('../config/db');
const { getIO } = require('../socket');
const { supabase } = require('../config/supabaseClient'); // We'll create this file next

// This function doesn't upload the file directly.
// It securely generates a temporary URL for the frontend to upload the file to.
exports.getPresignedUrl = async (req, res) => {
    try {
        const { fileName, fileType } = req.body;
        const { taskId } = req.params;
        const userId = req.user.id;

        if (!fileName || !fileType || !taskId) {
            return res.status(400).json({ msg: 'File name, type, and task ID are required.' });
        }

        const filePath = `${userId}/${taskId}/${Date.now()}-${fileName}`;

        // Generate a signed URL for uploading
        const { data, error } = await supabase.storage
            .from('project-files')
            .createSignedUploadUrl(filePath);

        if (error) {
            throw error;
        }

        res.json(data);
    } catch (err) {
        console.error('Error generating presigned URL:', err.message);
        res.status(500).send('Server Error');
    }
};

// This function is called *after* the frontend confirms the upload was successful.
// It saves the file's metadata to our database.
exports.addAttachmentRecord = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { file_name, file_url, file_type, file_size } = req.body;
        const userId = req.user.id;

        const newAttachmentResult = await pool.query(
            'INSERT INTO attachments (task_id, user_id, file_name, file_url, file_type, file_size) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [taskId, userId, file_name, file_url, file_type, file_size]
        );
        const newAttachment = newAttachmentResult.rows[0];
        
        const taskResult = await pool.query('SELECT project_id FROM tasks WHERE id = $1', [taskId]);
        const projectId = taskResult.rows[0].project_id;
        
        // Notify the project room that a new attachment has been added
        const io = getIO();
        io.to(`project-${projectId}`).emit('attachment_added', { taskId: parseInt(taskId, 10), attachment: newAttachment });

        res.status(201).json(newAttachment);
    } catch (err) {
        console.error('Error adding attachment record:', err.message);
        res.status(500).send('Server Error');
    }
};

exports.deleteAttachment = async (req, res) => {
    try {
        const { attachmentId } = req.params;
        const userId = req.user.id;

        // First, get the attachment details from our DB
        const attResult = await pool.query('SELECT * FROM attachments WHERE id = $1', [attachmentId]);
        if (attResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Attachment not found.' });
        }
        const attachment = attResult.rows[0];

        // Security check: only the user who uploaded it or a project owner can delete.
        // (For simplicity, we'll only check for the uploader for now)
        if (attachment.user_id !== userId) {
            return res.status(403).json({ msg: 'You do not have permission to delete this file.' });
        }

        // 1. Delete the file from Supabase Storage
        const { error: storageError } = await supabase.storage
            .from('project-files')
            .remove([attachment.file_path]); // Assuming you store file_path from my previous suggestion

        if (storageError) {
           console.error("Supabase storage deletion error:", storageError.message);
           // Don't throw, just log. Proceed to delete DB record anyway.
        }

        // 2. Delete the record from our database
        await pool.query('DELETE FROM attachments WHERE id = $1', [attachmentId]);

        const taskResult = await pool.query('SELECT project_id FROM tasks WHERE id = $1', [attachment.task_id]);
        const projectId = taskResult.rows[0].project_id;
        
        // 3. Notify the project room
        const io = getIO();
        io.to(`project-${projectId}`).emit('attachment_deleted', { 
            taskId: attachment.task_id, 
            attachmentId: parseInt(attachmentId, 10) 
        });

        res.json({ msg: 'Attachment deleted successfully.' });
    } catch (err) {
        console.error('Error deleting attachment:', err.message);
        res.status(500).send('Server Error');
    }
};