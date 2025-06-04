// online_judge/backend/controllers/aiController.js

import { GoogleGenerativeAI } from '@google/generative-ai';
import Problem from '../models/Problem.js'; // Assuming Problem model exists

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Access your API key (ensure it's defined in your .env file)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not defined in .env file!');
    process.exit(1); // Exit if API key is missing
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' }); // Use 'gemini-pro' for text-only tasks

export const getCodeReview = async (req, res) => {
    const { submittedCode, problemId, language } = req.body;

    if (!submittedCode || !problemId || !language) {
        return res.status(400).json({ message: 'Submitted code, problem ID, and language are required.' });
    }

    try {
        // Fetch problem details to provide context to the AI
        const problem = await Problem.findById(problemId);

        if (!problem) {
            return res.status(404).json({ message: 'Problem not found.' });
        }

        const prompt = `You are an expert competitive programming code reviewer.
        Review the following ${language} code submission for the problem "${problem.title}".

        **Problem Description:**
        ${problem.description}

        **Input Format:**
        ${problem.inputFormat}

        **Output Format:**
        ${problem.outputFormat}

        **Constraints:**
        ${problem.constraints}

        **Submitted Code:**
        \`\`\`${language}
        ${submittedCode}
        \`\`\`

        Provide a concise, helpful, and constructive code review focusing on:
        1.  **Correctness:** Does it likely solve the problem? Point out any obvious logical flaws.
        2.  **Efficiency/Time Complexity:** Suggest improvements for speed (e.g., using better algorithms, avoiding redundant calculations). Mention its approximate time complexity if possible.
        3.  **Readability/Style:** Suggestions for cleaner code, better variable names, comments, etc.
        4.  **Edge Cases:** Any edge cases the code might miss.

        Format your review clearly with headings for each section. Keep the review focused and actionable for a competitive programmer. Start the review directly, without conversational greetings like "Here's a review..."`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ review: text });

    } catch (error) {
        console.error('Error getting AI code review:', error);
        // Log Gemini API errors for debugging
        if (error.response && error.response.data) {
            console.error('Gemini API Error details:', error.response.data);
        }
        res.status(500).json({ message: 'Failed to get AI code review. Please try again later.' });
    }
};