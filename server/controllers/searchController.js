const pool = require('../config/db');

exports.searchItems = async (req, res) => {
    const { q } = req.query; // q is our search query
    const userId = req.user.id;

    if (!q) {
        return res.status(400).json({ msg: 'Search query is required.' });
    }

    try {
        // We use ILIKE for case-insensitive search and '%' for wildcard matching
        const searchQuery = `%${q}%`;

        // This powerful SQL query searches two tables at once and combines the results
        const query = `
            SELECT id, title, 'project' as type, NULL as project_id
            FROM projects
            WHERE owner_id = $1 AND title ILIKE $2
            
            UNION ALL
            
            SELECT id, title, 'task' as type, project_id
            FROM tasks
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