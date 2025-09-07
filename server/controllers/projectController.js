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
        const projectsQuery = `
            SELECT
                p.*,
                COALESCE(t.total_tasks, 0) as total_tasks,
                COALESCE(t.done_tasks, 0) as done_tasks,
                CASE 
                    WHEN COALESCE(t.total_tasks, 0) > 0 THEN (COALESCE(t.done_tasks, 0) * 100.0 / t.total_tasks)
                    ELSE 0 
                END as completion_percentage
            FROM projects p
            JOIN project_members pm ON p.id = pm.project_id
            LEFT JOIN (
                SELECT 
                    project_id, 
                    COUNT(*) as total_tasks,
                    COUNT(CASE WHEN status = 'Done' THEN 1 END) as done_tasks
                FROM tasks
                GROUP BY project_id
            ) t ON p.id = t.project_id
            WHERE pm.user_id = $1
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
            "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2",
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
            "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2",
            [projectId, userId]
        );
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ msg: 'Forbidden: You are not a member of this project.' });
        }

        const members = await pool.query(
            `SELECT u.id, u.username 
             FROM users u
             JOIN project_members pm ON u.id = pm.user_id
             WHERE pm.project_id = $1`,
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
        const inviterId = parseInt(req.user.id, 10);

        // 1. Get Project and Invitee details
        const projectResult = await pool.query("SELECT name, owner_id FROM projects WHERE id = $1", [projectId]);
        if (projectResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Project not found.' });
        }
        const { name: projectName, owner_id: ownerId } = projectResult.rows[0];

        const inviteeResult = await pool.query("SELECT id FROM users WHERE email = $1", [inviteeEmail]);
        if (inviteeResult.rows.length === 0) {
            return res.status(404).json({ msg: 'User with that email does not exist.' });
        }
        const inviteeId = inviteeResult.rows[0].id;

        // 2. Authorization and Validation Checks
        if (ownerId !== inviterId) {
            return res.status(403).json({ msg: 'Forbidden: Only the project owner can invite members.' });
        }
        if (inviteeId === inviterId) {
            return res.status(400).json({ msg: 'You cannot invite yourself to a project.' });
        }

        // Check if the user is already a member
        const memberCheck = await pool.query(
            "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2",
            [projectId, inviteeId]
        );
        if (memberCheck.rows.length > 0) {
            return res.status(400).json({ msg: 'This user is already a member of the project.' });
        }

        // 3. Create a new invitation in the database
        const newInvitation = await pool.query(
            `INSERT INTO project_invitations (project_id, inviter_id, invitee_email)
       VALUES ($1, $2, $3)
       RETURNING *`,
            [projectId, inviterId, inviteeEmail]
        );

        // 4. Send a notification to the invited user
        try {
            await createNotification({
                recipient_id: inviteeId,
                sender_id: inviterId,
                type: 'project_invitation',
                content: `invited you to join the project "${projectName}"`,
                project_id: parseInt(projectId, 10),
                task_id: null
            });
        } catch (notificationError) {
            console.error("--- FAILED TO CREATE NOTIFICATION ---");
            console.error(notificationError.message);
        }

        res.status(201).json({ msg: 'Invitation has been sent successfully.', invitation: newInvitation.rows[0] });

    } catch (err) {
        // This specific error code means a UNIQUE constraint was violated
        if (err.code === '23505') {
            return res.status(400).json({ msg: 'A pending invitation for this user already exists for this project.' });
        }
        console.error("--- FAILED TO SEND INVITATION ---");
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.acceptInvitation = async (req, res) => {
    const { invitationId } = req.params;
    const userId = req.user.id;
    const client = await pool.connect(); // Get a client from the pool for a transaction

    try {
        await client.query('BEGIN'); // Start the transaction

        // 1. Find the invitation and verify the user is the invitee
        const invitationResult = await client.query(
            "SELECT * FROM project_invitations WHERE id = $1 AND status = 'pending'",
            [invitationId]
        );

        if (invitationResult.rows.length === 0) {
            await client.query('ROLLBACK'); // Abort the transaction
            return res.status(404).json({ msg: 'Invitation not found or has already been actioned.' });
        }

        const invitation = invitationResult.rows[0];
        const inviteeEmail = invitation.invitee_email;

        // Verify the logged-in user's email matches the invitee's email
        const userResult = await client.query("SELECT email FROM users WHERE id = $1", [userId]);
        if (userResult.rows[0].email !== inviteeEmail) {
            await client.query('ROLLBACK');
            return res.status(403).json({ msg: 'Forbidden: You cannot accept an invitation for another user.' });
        }

        // 2. Update the invitation status to 'accepted'
        await client.query(
            "UPDATE project_invitations SET status = 'accepted' WHERE id = $1",
            [invitationId]
        );

        // 3. Add the user to the project_members table
        await client.query(
            "INSERT INTO project_members (project_id, user_id) VALUES ($1, $2)",
            [invitation.project_id, userId]
        );

        await client.query('COMMIT'); // Commit the transaction
        res.json({ msg: 'Invitation accepted successfully. You are now a member of the project.' });

    } catch (err) {
        await client.query('ROLLBACK'); // Rollback on any error
        console.error(err.message);
        res.status(500).send('Server Error');
    } finally {
        client.release(); // Release the client back to the pool
    }
};

exports.declineInvitation = async (req, res) => {
    const { invitationId } = req.params;
    const userId = req.user.id;

    try {
        // Find the invitation and verify the logged-in user is the invitee
        const invitationResult = await pool.query(
            "SELECT * FROM project_invitations WHERE id = $1 AND status = 'pending'",
            [invitationId]
        );

        if (invitationResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Invitation not found or has already been actioned.' });
        }

        const userResult = await pool.query("SELECT email FROM users WHERE id = $1", [userId]);
        if (userResult.rows[0].email !== invitationResult.rows[0].invitee_email) {
            return res.status(403).json({ msg: 'Forbidden: You cannot decline an invitation for another user.' });
        }

        // Update the invitation status to 'declined'
        await pool.query(
            "UPDATE project_invitations SET status = 'declined' WHERE id = $1",
            [invitationId]
        );

        res.json({ msg: 'Invitation declined successfully.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getPendingInvitations = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find the user's email first
        const userResult = await pool.query("SELECT email FROM users WHERE id = $1", [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found.' });
        }
        const userEmail = userResult.rows[0].email;

        // Now, fetch all pending invitations for that email
        // We also join with the projects and users tables to get the project name and inviter's name
        const invitationsResult = await pool.query(
            `SELECT 
                pi.id, 
                pi.status, 
                p.name AS project_name, 
                u.username AS inviter_name
             FROM project_invitations pi
             JOIN projects p ON pi.project_id = p.id
             JOIN users u ON pi.inviter_id = u.id
             WHERE pi.invitee_email = $1 AND pi.status = 'pending'`,
            [userEmail]
        );

        res.json(invitationsResult.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;

        // Security Check: Only allow the project owner to delete it
        const projectMember = await pool.query(
            'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
            [projectId, userId]
        );

        if (projectMember.rows.length === 0 || projectMember.rows[0].role !== 'owner') {
            return res.status(403).json({ msg: 'Permission denied. Only the project owner can delete this project.' });
        }

        await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);
        res.status(200).json({ msg: 'Project and all its tasks have been deleted successfully.' });
    } catch (err) {
        console.error('Error deleting project:', err.message);
        res.status(500).send('Server Error');
    }
};

