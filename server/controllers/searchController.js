const pool = require('../config/db');

exports.searchItems = async (req, res) => {
    const { q } = req.query;
    const userId = req.user.id;

    if (!q) {
        return res.status(400).json({ msg: 'Search query is required.' });
    }

    try {
        const searchQuery = `%${q}%`;

        // --- THIS IS THE FIX ---
        // The first part of the query is changed from "p.title" to "p.name"
        // to match your 'projects' table schema.
        const query = `
            SELECT id, name as title, 'project' as type, NULL as project_id
            FROM projects p
            WHERE owner_id = $1 AND name ILIKE $2
            
            UNION ALL
            
            SELECT id, title, 'task' as type, project_id
            FROM tasks t
            WHERE project_id IN (SELECT id FROM projects WHERE owner_id = $1)
            AND title ILIKE $2
            
            LIMIT 10;
        `;

        const results = await pool.query(query, [userId, searchQuery]);
        res.json(results.rows);

    } catch (error) {
        console.error('Search error:', error.message);
        res.status(500).send('Server Error');
    }
};