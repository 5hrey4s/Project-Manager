const { Pool } = require('pg');
const dns = require('dns');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    // Force IPv4 lookup
    lookup: (hostname, options, callback) => {
        return dns.lookup(hostname, { family: 4 }, callback);
    }
});

module.exports = pool;
