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

    if (!email) {
        return done(new Error('Email not provided by the authentication provider.'));
    }

    try {
        // Step 1: Find user by their specific provider ID (e.g., their unique Google ID)
        let result = await pool.query('SELECT * FROM users WHERE provider = $1 AND provider_id = $2', [provider, provider_id]);

        if (result.rows.length > 0) {
            console.log('User found by provider ID. Logging in.');
            return done(null, result.rows[0]);
        }

        // Step 2: If not found, check if a user with that email already exists (from a different login method)
        result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length > 0) {
            console.log(`Email found. Linking ${provider} account to existing user.`);
            // This is where you could add logic to update the user record with the new provider_id if you want to store it.
            return done(null, result.rows[0]);
        }

        // Step 3: If no user exists with that provider ID or email, create a new user
        console.log('No existing user found. Creating new user.');
        const username = displayName || email.split('@')[0];
        const newUserResult = await pool.query(
            'INSERT INTO users (username, email, provider, provider_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [username, email, provider, provider_id]
        );

        return done(null, newUserResult.rows[0]);

    } catch (err) {
        // Handle potential race conditions or other DB errors
        if (err.code === '23505') { // Unique constraint violation
            console.error('Database error: A user with this username or email already exists.', err.detail);
            return done(new Error('A user with this username or email already exists.'));
        }
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