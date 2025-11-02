const pool = require('../config/db');
const { GoogleGenAI } = require("@google/genai");
const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

exports.generateTasks = async (req, res) => {
    try {
        const { goal, projectId } = req.body;

        if (!goal || !projectId) {
            return res.status(400).json({ msg: 'A project goal and projectId are required.' });
        }

        // --- NEW: Fetching Project Context ---
        const existingTasksResult = await pool.query(
    'SELECT title, description FROM tasks WHERE project_id = $1', // <-- Corrected query
    [projectId]
);
        const membersResult = await pool.query(
            `SELECT u.id, u.username FROM users u JOIN project_members pm ON u.id = pm.user_id WHERE pm.project_id = $1`,
            [projectId]
        );

        const existingTasks = existingTasksResult.rows;
        const members = membersResult.rows;

        // --- NEW: Building a Rich Context String for the AI ---
        let projectContext = "This is the current state of the project.\n";
        projectContext += `Project Members: ${members.map(m => `${m.username} (ID: ${m.id})`).join(', ')}\n`;
        projectContext += "Existing Tasks:\n" + existingTasks.map(t => `- ${t.title}`).join('\n');


        // --- NEW: A More Advanced, Structured Prompt ---
        const prompt = `You are an expert project manager. Your goal is to break down a high-level objective into actionable tasks.
        
        Based on the provided project context, generate a list of new tasks for the objective: "${goal}".
        - Do NOT create tasks that are duplicates of the "Existing Tasks".
        - For each task, provide a clear title and a concise, one-sentence description.
        - If it makes sense, suggest an assignee for the task by using their member ID.
        
        Return your response ONLY as a valid JSON array of objects. Each object must have the following keys: "title" (string), "description" (string), and "suggested_assignee_id" (integer or null).

        ---
        CONTEXT:
        ${projectContext}
        ---
        `;

        // --- THIS IS THE FIX ---
        // The new syntax calls generateContent directly from the models service
        const result = await genAI.models.generateContent({
            model: "gemini-1.5-flash", // Use a modern, fast model
            contents: [{ parts: [{ text: prompt }] }]
        });
        const response = await result.response;
        const text = response.text();

        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const generatedTasks = JSON.parse(cleanedText);

        // Send the rich array of task objects directly
        res.json(generatedTasks);

    } catch (error) {
        console.error("Error generating AI tasks:", error);
        res.status(500).send('Failed to generate tasks from AI.');
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


const model = genAI.getGenerativeModel({ model: "gemini-pro" });
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