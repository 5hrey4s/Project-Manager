const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');
const auth = require('../middleware/auth');

// --- PUBLIC ROUTES ---
// This route starts the GitHub login. It must be public.
router.get('/github/auth', integrationController.redirectToGithubAuth);

// This webhook is for server-to-server communication from GitHub.
// It uses its own signature verification instead of our auth middleware.
router.post('/github/webhook', integrationController.handleGithubWebhook);

// --- PROTECTED ROUTES ---
// The user must be logged into our application for these routes to work.

// This route handles the user's return from GitHub. It needs 'auth'
// to know which user account to link the new GitHub token to.
router.get('/github/callback', auth, integrationController.handleGithubCallback);

// This route links a task to a PR and requires a logged-in user.
router.post('/tasks/:taskId/link-github', auth, integrationController.linkTaskToPullRequest);

// --- NEW ROUTE for App Installation ---
// This will be the "Setup URL" you put in GitHub's settings.
router.get('/github/installation/callback', auth, integrationController.handleGithubInstallationCallback);

module.exports = router;