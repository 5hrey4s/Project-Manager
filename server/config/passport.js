const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const pool = require('./db');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        const user = result.rows[0];
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// --- Shared Verification Logic ---
const verifyCallback = async (accessToken, refreshToken, profile, done) => {
    const { id: provider_id, provider, displayName, emails } = profile;
    const email = emails && emails.length > 0 ? emails[0].value : null;

    // --- TEMPORARY HARDCODED CONNECTION ---
    // Replace this with your actual, clean connection string
    const connectionString = 'postgresql://postgres:V4VPZCyjM5eJV6yx@db.xvpoazghxemrpiwqebgl.supabase.co:5432/postgres';
    const tempPool = new Pool({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });
    // --- END OF TEMPORARY CODE ---


    if (!email) {
        return done(new Error('Email not provided by the authentication provider.'));
    }

    try {
        // Use the tempPool instead of the imported pool
        let result = await tempPool.query('SELECT * FROM users WHERE provider = $1 AND provider_id = $2', [provider, provider_id]);

        if (result.rows.length > 0) {
            await tempPool.end(); // Close the temporary pool
            return done(null, result.rows[0]);
        }

        result = await tempPool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length > 0) {
            await tempPool.end(); // Close the temporary pool
            return done(null, result.rows[0]);
        }

        const username = displayName || email.split('@')[0];
        const newUserResult = await tempPool.query(
            'INSERT INTO users (username, email, provider, provider_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [username, email, provider, provider_id]
        );

        await tempPool.end(); // Close the temporary pool
        return done(null, newUserResult.rows[0]);

    } catch (err) {
        await tempPool.end(); // Close the temporary pool on error
        console.error('Error in Passport verification callback:', err);
        return done(err);
    }
};


// --- Google Strategy Configuration ---
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
}, verifyCallback));


// --- GitHub Strategy Configuration ---
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
    scope: ['user:email'] // Important: ensures you get the user's email
}, verifyCallback));