const { Pool } = require('pg');
require('dotenv').config();

// The Supabase host from your connection string
const supabaseHost = 'db.xvpoazghxemrpiwqebgl.supabase.co'; // IMPORTANT: Use your OLD project host

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    host: supabaseHost, // This forces the connection over IPv4
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = pool;