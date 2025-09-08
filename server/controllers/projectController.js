// server/controllers/projectController.js
const pool = require('../config/db');
const { createNotification } = require('../services/notificationService');

exports.createProject = async (req, res) => {
    try {
        const { name, description } = req.body;
        const ownerId = req.user.id;

        if (!name) {
            return res.status(400).json({ msg: 'Project name is required' });
        }

        const newProjectResult = await pool.query(
            "INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *",
            [name, description || null, ownerId]
        );

        const newProject = newProjectResult.rows[0];

        await pool.query(
            "INSERT INTO project_members (project_id, user_id) VALUES ($1, $2)",
            [newProject.id, ownerId]
        );

        res.status(201).json(newProject);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getUserProjects = async (req, res) => {
    try {
        const userId = req.user.id;
        // --- FIX: This query now correctly checks for is_active ---
        const projectsQuery = `
            SELECT p.*,
                   COALESCE(t.total_tasks, 0) as total_tasks,
                   COALESCE(t.done_tasks, 0) as done_tasks,
                   CASE WHEN COALESCE(t.total_tasks, 0) > 0 THEN (COALESCE(t.done_tasks, 0) * 100.0 / t.total_tasks)
                        ELSE 0 END as completion_percentage
            FROM projects p
            JOIN project_members pm ON p.id = pm.project_id
            LEFT JOIN (
                SELECT project_id, COUNT(*) as total_tasks, COUNT(CASE WHEN status = 'Done' THEN 1 END) as done_tasks
                FROM tasks GROUP BY project_id
            ) t ON p.id = t.project_id
            WHERE pm.user_id = $1 AND pm.is_active = TRUE
            ORDER BY p.updated_at DESC;
        `;
        const projectsResult = await pool.query(projectsQuery, [userId]);
        res.json(projectsResult.rows);
    } catch (err) {
        console.error('Error fetching user projects:', err.message);
        res.status(500).send('Server Error');
    }
};

exports.getProjectById = async (req, res) => {
    try {
        const projectId = parseInt(req.params.projectId, 10);
        const userId = parseInt(req.user.id, 10);

        const memberCheck = await pool.query(
            "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2 AND is_active = TRUE",
            [projectId, userId]
        );
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ msg: 'Forbidden: You are not a member of this project.' });
        }

        const projectResult = await pool.query("SELECT * FROM projects WHERE id = $1", [projectId]);
        if (projectResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Project not found.' });
        }

        res.json(projectResult.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getProjectMembers = async (req, res) => {
    try {
        const projectId = parseInt(req.params.projectId, 10);
        const userId = parseInt(req.user.id, 10);

        const memberCheck = await pool.query(
            "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2 AND is_active = TRUE",
            [projectId, userId]
        );
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ msg: 'Forbidden: You are not a member of this project.' });
        }

        const members = await pool.query(
            `SELECT u.id, u.username 
             FROM users u
             JOIN project_members pm ON u.id = pm.user_id
             WHERE pm.project_id = $1 AND pm.is_active = TRUE`,
            [projectId]
        );
        res.json(members.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.inviteProjectMember = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { email: inviteeEmail } = req.body;
        const inviterId = req.user.id;

        const projectResult = await pool.query("SELECT name, owner_id FROM projects WHERE id = $1", [projectId]);
        if (projectResult.rows.length === 0) return res.status(404).json({ msg: 'Project not found.' });
        
        const { name: projectName, owner_id: ownerId } = projectResult.rows[0];
        if (ownerId !== inviterId) return res.status(403).json({ msg: 'Forbidden: Only the project owner can invite members.' });

        const inviteeResult = await pool.query("SELECT id FROM users WHERE email = $1", [inviteeEmail]);
        if (inviteeResult.rows.length === 0) return res.status(404).json({ msg: 'User with that email does not exist.' });
        
        const inviteeId = inviteeResult.rows[0].id;
        if (inviteeId === inviterId) return res.status(400).json({ msg: 'You cannot invite yourself.' });

        const memberCheck = await pool.query("SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2 AND is_active = TRUE", [projectId, inviteeId]);
        if (memberCheck.rows.length > 0) return res.status(400).json({ msg: 'This user is already a member.' });

        const newInvitationResult = await pool.query(
            `INSERT INTO project_invitations (project_id, inviter_id, invitee_email) VALUES ($1, $2, $3) RETURNING *`,
            [projectId, inviterId, inviteeEmail]
        );
        const newInvitation = newInvitationResult.rows[0];
        
        // --- FIX: Emit a specific real-time event for the new invitation ---
        const io = getIO();
        const inviterResult = await pool.query("SELECT username FROM users WHERE id = $1", [inviterId]);
        io.to(`user-${inviteeId}`).emit('new_invitation', {
            id: newInvitation.id,
            project_name: projectName,
            inviter_name: inviterResult.rows[0].username,
        });

        // Still create a generic notification for the database record
        await createNotification({
            recipient_id: inviteeId,
            sender_id: inviterId,
            type: 'project_invitation',
            content: `invited you to join the project "${projectName}"`,
            project_id: parseInt(projectId, 10),
            task_id: null
        });

        res.status(201).json({ msg: 'Invitation sent.' });
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ msg: 'A pending invitation for this user already exists.' });
        console.error("Invitation Error:", err.message);
        res.status(500).send('Server Error');
    }
};


exports.removeProjectMember = async (req, res) => {
    try {
        const { projectId, userId } = req.params;
        const removerId = req.user.id;

        const projectResult = await pool.query("SELECT owner_id FROM projects WHERE id = $1", [projectId]);
        if (projectResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Project not found.' });
        }
        const { owner_id: ownerId } = projectResult.rows[0];

        if (ownerId !== removerId) {
            return res.status(403).json({ msg: 'Forbidden: Only the project owner can remove members.' });
        }

        if (ownerId === parseInt(userId, 10)) {
            return res.status(400).json({ msg: 'Project owner cannot be removed.' });
        }

        const updateResult = await pool.query(
            "UPDATE project_members SET is_active = FALSE WHERE project_id = $1 AND user_id = $2 RETURNING *",
            [projectId, userId]
        );

        if (updateResult.rowCount === 0) {
            return res.status(404).json({ msg: 'Member not found in this project or already inactive.' });
        }

        res.json({ msg: 'User has been successfully removed from the project.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;

        const projectResult = await pool.query(
            'SELECT owner_id FROM projects WHERE id = $1',
            [projectId]
        );

        if (projectResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Project not found.' });
        }

        if (projectResult.rows[0].owner_id !== userId) {
            return res.status(403).json({ msg: 'Permission denied. Only the project owner can delete this project.' });
        }

        await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);
        res.status(200).json({ msg: 'Project and all its tasks have been deleted successfully.' });
    } catch (err) {
        console.error('Error deleting project:', err.message);
        res.status(500).send('Server Error');
    }
};
// The extra brace was here