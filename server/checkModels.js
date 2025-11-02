// Load environment variables from .env file
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("Error: GEMINI_API_KEY is not set in your .env file.");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log("Fetching available models for your API key...");

fetch(url)
    .then(response => {
        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("--- Successfully fetched models ---");
        if (data.models && data.models.length > 0) {
            console.log("Your API key has access to the following models:");
            data.models.forEach(model => {
                console.log(`- ${model.name} (Supports: ${model.supportedGenerationMethods.join(', ')})`);
            });
        } else {
            console.log("No models found for your API key.");
        }
        console.log("-------------------------------------");
    })
    .catch(error => {
        console.error("\n--- Error ---");
        console.error("Failed to fetch models:", error.message);
        console.error("\nThis error (e.g., 404 or 403) strongly suggests the 'Generative Language API' is not enabled in your Google Cloud project.");
        console.error("Please go to https://console.cloud.google.com, find your project, and enable the API.");
        console.log("-------------");
    });