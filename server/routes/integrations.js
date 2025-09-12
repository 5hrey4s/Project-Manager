const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');
const auth = require('../middleware/auth');

// Note: The webhook endpoint does not use our standard 'auth' middleware
// because it needs to be publicly accessible for GitHub to send events.
// Security is handled by verifying the webhook signature.

router.post('/github/webhook', integrationController.handleGithubWebhook);

// New OAuth routes
router.get('/github/auth', auth, integrationController.redirectToGithubAuth);
router.get('/github/callback', integrationController.handleGithubCallback);

// New route to link a task to a PR
router.post('/tasks/:taskId/link-github', auth, integrationController.linkTaskToPullRequest);

module.exports = router;