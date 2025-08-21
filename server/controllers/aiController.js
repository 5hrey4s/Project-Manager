const pool = require('../config/db');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.generateTasks = async (req, res) => {
    try {
        const { goal, projectId } = req.body;
        const userId = parseInt(req.user.id, 10);

        if (!goal || !projectId) {
            return res.status(400).json({ msg: 'A project goal and projectId are required.' });
        }

        const memberCheck = await pool.query(
            "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2",
            [projectId, userId]
        );
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ msg: 'Forbidden: You are not a member of this project.' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const prompt = `As an expert project manager, break down the following high-level goal into a concise list of actionable tasks for a Kanban board. The goal is: "${goal}".
        Return your response ONLY as a valid JSON array of strings, with no other text or explanation. For example: ["Task 1", "Task 2", "Task 3"]`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const tasks = JSON.parse(cleanedText);

        res.json({ suggestedTasks: tasks });
    } catch (error) {
        console.error("Error generating AI tasks:", error);
        res.status(500).json({ msg: 'Failed to generate tasks from AI.' });
    }
};

exports.copilot = async (req, res) => {
    try {
        const { projectId, message } = req.body;
        const userId = parseInt(req.user.id, 10);

        if (!projectId || !message) {
            return res.status(400).json({ msg: 'Project ID and a message are required.' });
        }

        const memberCheck = await pool.query(
            "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2",
            [projectId, userId]
        );
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ msg: 'Forbidden: You are not a member of this project.' });
        }

        const tasksResult = await pool.query("SELECT * FROM tasks WHERE project_id = $1", [projectId]);
        const membersResult = await pool.query(
            `SELECT u.id, u.username FROM users u JOIN project_members pm ON u.id = pm.user_id WHERE pm.project_id = $1`,
            [projectId]
        );

        const tasks = tasksResult.rows;
        const members = membersResult.rows;

        let projectContext = "Current Project State:\n";
        projectContext += `- Members: ${members.map(m => `${m.username} (ID: ${m.id})`).join(', ')}\n`;
        projectContext += "- Tasks:\n";
        tasks.forEach(task => {
            const assignee = members.find(m => m.id === task.assignee_id);
            projectContext += `  - Task Title: "${task.title}" (ID: ${task.id}), Status: ${task.status}, Assigned to: ${assignee ? assignee.username : 'Unassigned'}\n`;
        });

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const prompt = `You are an intelligent project management assistant. Based ONLY on the provided project state, answer the user's question concisely.
        
        ---
        CONTEXT:
        ${projectContext}
        ---
        
        USER'S QUESTION:
        "${message}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ reply: text });
    } catch (error) {
        console.error("Copilot Error:", error);
        res.status(500).json({ msg: 'The AI assistant failed to respond.' });
    }
};