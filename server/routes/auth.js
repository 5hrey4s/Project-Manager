const router = require('express').Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

// Route 1: Kicks off the login process
// When the user clicks "Sign in with Google", the frontend will navigate to this URL.
// Passport will then redirect them to Google's consent screen.
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Route 2: The callback URL
// After the user approves the login on Google's site, Google redirects them here.
// Passport handles the code exchange and calls our callback function from passport.js.
router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${process.env.CLIENT_URL}/login?error=google-auth-failed`, // Redirect on failure
        session: false // We are using JWTs, not sessions
    }),
    (req, res) => {
        // If we get here, the user is authenticated by Passport.
        // Now, we create our own JWT to give to the frontend.
        const payload = {
            user: {
                id: req.user.id,
                username: req.user.username
            }
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Redirect the user back to a special frontend route with the token.
        // The frontend will be responsible for grabbing this token and saving it.
        res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
    }
);

module.exports = router;