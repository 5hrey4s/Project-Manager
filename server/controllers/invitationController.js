const pool = require('../config/db');

exports.getPendingInvitations = async (req, res) => {
    const userEmail = req.user.email;
    try {
        const invitationsResult = await pool.query(
            `SELECT pi.id, pi.status, p.name AS project_name, u.username AS inviter_name
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

exports.acceptInvitation = async (req, res) => {
    const { invitationId } = req.params;
    const userId = req.user.id;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const invResult = await client.query("SELECT * FROM project_invitations WHERE id = $1 AND status = 'pending'", [invitationId]);
        if (invResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ msg: 'Invitation not found or has already been actioned.' });
        }
        const invitation = invResult.rows[0];
        const userResult = await client.query("SELECT email FROM users WHERE id = $1", [userId]);
        if (userResult.rows[0].email !== invitation.invitee_email) {
            await client.query('ROLLBACK');
            return res.status(403).json({ msg: 'This invitation is not for you.' });
        }
        await client.query("UPDATE project_invitations SET status = 'accepted' WHERE id = $1", [invitationId]);
        await client.query("INSERT INTO project_members (project_id, user_id) VALUES ($1, $2)", [invitation.project_id, userId]);
        await client.query('COMMIT');
        res.json({ msg: 'Invitation accepted.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send('Server Error');
    } finally {
        client.release();
    }
};

exports.declineInvitation = async (req, res) => {
    const { invitationId } = req.params;
    const userId = req.user.id;
    try {
        const invResult = await pool.query("SELECT * FROM project_invitations WHERE id = $1 AND status = 'pending'", [invitationId]);
        if (invResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Invitation not found or has already been actioned.' });
        }
        const userResult = await pool.query("SELECT email FROM users WHERE id = $1", [userId]);
        if (userResult.rows[0].email !== invResult.rows[0].invitee_email) {
            return res.status(403).json({ msg: 'This invitation is not for you.' });
        }
        await pool.query("UPDATE project_invitations SET status = 'declined' WHERE id = $1", [invitationId]);
        res.json({ msg: 'Invitation declined.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};