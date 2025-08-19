const express = require('express');
const { Pool } = require('pg'); // Import the Pool class from the pg library

const app = express();
const PORT = 5000;

// --- Database Connection Setup ---
// Replace the connection details with your own PostgreSQL credentials
const pool = new Pool({
    user: 'your_postgres_username', // e.g., 'postgres'
    host: 'localhost',
    database: 'project_manager_db',
    password: 'your_postgres_password',
    port: 5432,
});

// --- Test Database Connection ---
// A simple test route to check if we can query the database
app.get('/test-db', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()'); // Query the current time from the DB
        res.json({ message: 'Database connection successful!', time: result.rows[0].now });
        client.release(); // Release the client back to the pool
    } catch (err) {
        console.error('Database connection error', err.stack);
        res.status(500).json({ error: 'Failed to connect to the database' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});