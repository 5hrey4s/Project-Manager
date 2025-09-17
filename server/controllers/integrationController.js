const pool = require('../config/db');
const crypto = require('crypto');
const { getIO } = require('../socket');
const axios = require('axios');

// This function will be called when GitHub sends an event (e.g., PR merged)
// This function handles incoming webhook events from GitHub
exports.handleGithubWebhook = async (req, res) => {
    // 1. Verify the webhook signature (this part stays the same)
    const signature = req.headers['x-hub-signature-256'];
    const expectedSignature = 'sha256=' + crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');

    if (signature !== expectedSignature) {
        console.error('Webhook signature verification failed.');
        return res.status(401).send('Invalid signature');
    }

    // 2. Process the event
    const event = req.headers['x-github-event'];
    const payload = req.body;

    // --- LOGIC FOR MERGED PRS (Existing) ---
    if (event === 'pull_request' && payload.action === 'closed' && payload.pull_request.merged) {
        console.log(`Webhook received: Pull Request #${payload.number} was merged!`);
        try {
            const linkResult = await pool.query('SELECT task_id FROM github_task_links WHERE github_item_url = $1', [payload.pull_request.html_url]);
            if (linkResult.rows.length > 0) {
                const { task_id } = linkResult.rows[0];
                const updateResult = await pool.query("UPDATE tasks SET status = 'Done', updated_at = NOW() WHERE id = $1 RETURNING *", [task_id]);
                if (updateResult.rows.length > 0) {
                    const updatedTask = updateResult.rows[0];
                    const io = getIO();
                    io.to(`project-${updatedTask.project_id}`).emit('task_updated', updatedTask);
                }
            }
        } catch (dbError) {
            console.error('Error processing merged PR webhook:', dbError.message);
        }
    }
    // --- NEW LOGIC FOR OPENED PRS (New) ---
    else if (event === 'pull_request' && payload.action === 'opened') {
        console.log(`Webhook received: Pull Request #${payload.number} was opened!`);
        try {
            // In a real-world app, you'd parse the PR title or body for a task ID like "INT-123"
            // For now, we'll assume it's already linked and find it by its URL
            const linkResult = await pool.query('SELECT task_id FROM github_task_links WHERE github_item_url = $1', [payload.pull_request.html_url]);
            if (linkResult.rows.length > 0) {
                const { task_id } = linkResult.rows[0];
                console.log(`Found linked task with ID: ${task_id}. Updating status to In Progress.`);

                const updateResult = await pool.query("UPDATE tasks SET status = 'In Progress', updated_at = NOW() WHERE id = $1 RETURNING *", [task_id]);

                if (updateResult.rows.length > 0) {
                    const updatedTask = updateResult.rows[0];
                    const io = getIO();
                    io.to(`project-${updatedTask.project_id}`).emit('task_updated', updatedTask);
                    console.log(`Task ${task_id} successfully moved to In Progress.`);
                }
            } else {
                console.log(`No pre-existing link found for opened PR URL: ${payload.pull_request.html_url}`);
            }
        } catch (dbError) {
            console.error('Error processing opened PR webhook:', dbError.message);
        }
    }

    // Acknowledge receipt of the event
    res.status(200).send('Event received');
};

// 1. Redirects the user to GitHub's authorization page
exports.redirectToGithubAuth = (req, res) => {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo`;
    res.redirect(githubAuthUrl);
};

// 2. Handles the callback from GitHub after user authorizes
exports.handleGithubCallback = async (req, res) => {
    const { code } = req.query;
    try {
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code: code,
        }, { headers: { 'Accept': 'application/json' } });

        const accessToken = tokenResponse.data.access_token;
        // Here you would typically save the access token to the user's profile in the database
        // For now, we will redirect back to the app.
        // In a real app: await pool.query('UPDATE users SET github_access_token = $1 WHERE id = $2', [accessToken, req.user.id]);

        res.redirect('http://localhost:3000/some-success-page'); // Redirect to your frontend
    } catch (error) {
        console.error('Error handling GitHub callback:', error.message);
        res.status(500).send('Authentication failed');
    }
};

// 3. Creates a link between a task and a GitHub PR
exports.linkTaskToPullRequest = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { prUrl } = req.body;
        const userId = req.user.id;

        // Basic validation for PR URL
        if (!prUrl || !prUrl.includes('github.com')) {
            return res.status(400).json({ msg: 'Invalid GitHub Pull Request URL provided.' });
        }

        // Extract info from URL (this is a simplified example)
        const parts = prUrl.split('/');
        const prId = parts[parts.length - 1];
        const repoName = `${parts[3]}/${parts[4]}`;

        // In a real app, you would use the GitHub API to get the PR's real ID and repo ID
        const fakeRepoId = 12345; // Placeholder

        const newLink = await pool.query(
            'INSERT INTO github_task_links (task_id, github_item_url, github_item_id, github_repo_id, created_by_user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [taskId, prUrl, prId, fakeRepoId, userId]
        );

        res.status(201).json(newLink.rows[0]);
    } catch (error) {
        console.error('Error linking task to PR:', error);
        res.status(500).send('Server Error');
    }
};

exports.handleGithubInstallationCallback = (req, res) => {
    const { installation_id } = req.query;

    if (!installation_id) {
        return res.redirect(`${process.env.CLIENT_URL}/dashboard?integration=failed`);
    }

    // Immediately redirect to a new frontend page, passing the ID.
    res.redirect(`${process.env.CLIENT_URL}/integration/github/finalize?installation_id=${installation_id}`);
};

// Add this new function to securely save the ID.
exports.saveGithubInstallation = async (req, res) => {
    const { installationId } = req.body;
    const userId = req.user.id; // Comes from the 'auth' middleware on the new route

    if (!installationId) {
        return res.status(400).json({ msg: 'Installation ID is required.' });
    }

    try {
        await pool.query(
            'UPDATE users SET github_installation_id = $1 WHERE id = $2',
            [installationId, userId]
        );
        res.status(200).json({ msg: 'Installation saved successfully.' });
    } catch (error) {
        console.error('Error saving installation ID:', error.message);
        res.status(500).send('Server Error');
    }
};