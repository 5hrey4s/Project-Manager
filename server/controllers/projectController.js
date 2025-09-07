const pool = require('../config/db');

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

exports.addProjectMember = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { email } = req.body;
        const inviterId = parseInt(req.user.id, 10);

        const userToInviteResult = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
        if (userToInviteResult.rows.length === 0) {
            return res.status(404).json({ msg: 'User with that email does not exist.' });
        }
        const userToInviteId = userToInviteResult.rows[0].id;

        const projectResult = await pool.query("SELECT name, owner_id FROM projects WHERE id = $1", [projectId]);
        if (projectResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Project not found.' });
        }
        const { name: projectName, owner_id: ownerId } = projectResult.rows[0];

        if (ownerId !== inviterId) {
            return res.status(403).json({ msg: 'Forbidden: Only the project owner can invite members.' });
        }

        // Add the user to the project
        await pool.query(
            "INSERT INTO project_members (project_id, user_id) VALUES ($1, $2)",
            [projectId, userToInviteId]
        );

        // --- FIX: Create a notification for the invited user ---
        if (userToInviteId !== inviterId) { // Do not notify the owner if they invite themselves
            await createNotification({
                recipient_id: userToInviteId,
                sender_id: inviterId,
                type: 'project_invitation',
                content: `invited you to join the project "${projectName}"`,
                project_id: parseInt(projectId, 10),
                task_id: null // No specific task is associated with a project invite
            });
        }

        res.status(201).json({ msg: 'User successfully added to the project.' });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ msg: 'User is already a member of this project.' });
        }
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