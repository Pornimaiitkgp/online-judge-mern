// import { GoogleGenAI } from "@google/genai";

// import dotenv from 'dotenv';dotenv.config();
// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// export const aiCodeReview= async (code) => {
//     const response = await ai.models.generateContent({
//     model: "gemini-1.5-flash",
//     contents: `Check the following code for errors or bugs.
//     Code: ${code}`,
//   });
//   console.log(response.text);
//   return response.text;

// };


// aiCodeReview.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const aiCodeReview = async (code) => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }
    try {
        // --- CHANGE THIS LINE ---
        // Try 'gemini-1.0-pro' first. If that fails, try 'models/text-bison-001'
        const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" }); 

        const result = await model.generateContent(`Review the following C++ code. Provide only suggestions for improvement, potential bug fixes, best practices, and explain any issues found. DO NOT provide a corrected solution or rewrite the code. Focus strictly on reviewing the provided code.

Code:
\`\`\`
${code}
\`\`\`

Format your review clearly, using bullet points or numbered lists for suggestions. If the code is perfect, just say "No significant issues found."`);

        const response = result.response;
        const text = response.text();
        console.log("AI Review Result:", text);
        return text;
    } catch (error) {
        console.error("Error calling Google Generative AI API:", error);
        // Provide more context to the frontend error
        throw new Error(`Failed to get AI review: ${error.message}`);
    }
};