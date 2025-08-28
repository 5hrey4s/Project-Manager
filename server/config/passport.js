const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./db'); // Make sure this path to your db config is correct
const jwt = require('jsonwebtoken');
const GitHubStrategy = require('passport-github2').Strategy; // <<< Import GitHub Strategy

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback", // Must match the URI in Google Cloud Console
    proxy: true // Important for Render deployment
},
    async (accessToken, refreshToken, profile, done) => {
        const { id, displayName, emails, photos } = profile;
        const email = emails[0].value;
        const avatarUrl = photos[0].value;

        try {
            // Check if the user already exists in your database via Google ID or email
            let userResult = await pool.query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [id, email]);
            let user = userResult.rows[0];

            if (!user) {
                // If user doesn't exist, create a new one
                const newUserResult = await pool.query(
                    'INSERT INTO users (google_id, username, email, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *',
                    [id, displayName, email, avatarUrl]
                );
                user = newUserResult.rows[0];
            } else if (!user.google_id) {
                // If user exists with email but hasn't linked Google, link the account
                await pool.query('UPDATE users SET google_id = $1, avatar_url = $2 WHERE email = $3', [id, avatarUrl, email]);
                user.google_id = id; // Update the user object for the callback
            }

            return done(null, user); // Success! Pass the user object to the next step
        } catch (err) {
            return done(err, null); // An error occurred
        }
    }
));

// --- NEW: GitHub Strategy ---
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "/api/auth/github/callback",
    scope: ['user:email'] // <<< Important: asks for user's primary email
},
    async (accessToken, refreshToken, profile, done) => {
        const { id, displayName, emails, photos } = profile;
        const email = emails[0].value;
        const avatarUrl = photos ? photos[0].value : null;

        try {
            let userResult = await pool.query('SELECT * FROM users WHERE github_id = $1 OR email = $2', [id, email]);
            let user = userResult.rows[0];

            if (user) {
                if (!user.github_id) {
                    // If user exists with email but hasn't linked GitHub, link the account
                    await pool.query('UPDATE users SET github_id = $1, avatar_url = $2 WHERE id = $3', [id, avatarUrl, user.id]);
                    user.github_id = id;
                }
            } else {
                // If user doesn't exist, create a new one
                const newUserResult = await pool.query(
                    'INSERT INTO users (github_id, username, email, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *',
                    [id, displayName, email, avatarUrl]
                );
                user = newUserResult.rows[0];
            }

            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }
));