const { Pool } = require('pg');
const dns = require('dns');
require('dotenv').config();

const dbUrl = new URL(process.env.DATABASE_URL);

const pool = new Pool({
    user: dbUrl.username,
    password: dbUrl.password,
    host: dbUrl.hostname,    // db.xvpoazghxemrpiwqebgl.supabase.co
    port: dbUrl.port || 5432,
    database: dbUrl.pathname.split('/')[1],
    ssl: { rejectUnauthorized: false },
    // Force IPv4 resolution
    lookup: (hostname, opts, cb) => {
        dns.lookup(hostname, { family: 4 }, cb);
    }
});

module.exports = pool;
