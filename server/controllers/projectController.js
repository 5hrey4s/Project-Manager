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
        const projects = await pool.query(
            "SELECT * FROM projects WHERE owner_id = $1 ORDER BY created_at DESC",
            [req.user.id]
        );
        res.json(projects.rows);
    } catch (err) {
        console.error(err.message);
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

        const projectResult = await pool.query("SELECT owner_id FROM projects WHERE id = $1", [projectId]);
        if (projectResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Project not found.' });
        }

        if (projectResult.rows[0].owner_id !== inviterId) {
            return res.status(403).json({ msg: 'Forbidden: Only the project owner can invite members.' });
        }

        await pool.query(
            "INSERT INTO project_members (project_id, user_id) VALUES ($1, $2)",
            [projectId, userToInviteId]
        );
        res.status(201).json({ msg: 'User successfully added to the project.' });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ msg: 'User is already a member of this project.' });
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};