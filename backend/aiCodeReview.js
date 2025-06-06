
// // aiCodeReview.js
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import dotenv from 'dotenv';

// dotenv.config();

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// export const aiCodeReview = async (code) => {
//     if (!process.env.GEMINI_API_KEY) {
//         throw new Error("GEMINI_API_KEY is not set in environment variables.");
//     }
//     try {
//         // --- CHANGE THIS LINE ---
//         // Try 'gemini-1.0-pro' first. If that fails, try 'models/text-bison-001'
//         const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" }); 

//         const result = await model.generateContent(`Review the following C++ code. Provide only suggestions for improvement, potential bug fixes, best practices, and explain any issues found. DO NOT provide a corrected solution or rewrite the code. Focus strictly on reviewing the provided code.

// Code:
// \`\`\`
// ${code}
// \`\`\`

// Format your review clearly, using bullet points or numbered lists for suggestions. If the code is perfect, just say "No significant issues found."`);

//         const response = result.response;
//         const text = response.text();
//         console.log("AI Review Result:", text);
//         return text;
//     } catch (error) {
//         console.error("Error calling Google Generative AI API:", error);
//         // Provide more context to the frontend error
//         throw new Error(`Failed to get AI review: ${error.message}`);
//     }
// };




// aiCodeReview.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Modify this function to accept `problemStatement`
export const aiCodeReview = async (code, problemStatement) => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }
    try {
        const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" }); 

        const prompt = `
You are an AI code reviewer for an online judge system.
Your task is to review the user's submitted code against a given problem statement.

**Problem Statement:**
${problemStatement || "No problem statement provided."}

**User's Submitted Code:**
\`\`\`cpp
${code}
\`\`\`

**Instructions for Review:**
1.  **Evaluate Correctness:** State clearly whether the submitted code appears to correctly solve the problem described in the 'Problem Statement'. Explain why or why not, referencing aspects of the code and problem requirements.
2.  **Identify Issues:** Point out any bugs, syntax errors, runtime errors, or logical flaws in the code.
3.  **Provide Suggestions for Improvement:** Offer advice on code quality, efficiency, readability, and best practices.
4.  **DO NOT provide a corrected solution or rewrite the code.** Focus strictly on reviewing the provided code and explaining its deficiencies or strengths in relation to the problem.

Format your review clearly, using bullet points or numbered lists for suggestions. If the code correctly solves the problem and has no significant issues, just say "No significant issues found for solving the problem and code quality."
`; // End of prompt template

        const result = await model.generateContent(prompt);

        const response = result.response;
        const text = response.text();
        console.log("AI Review Result:", text);
        return text;
    } catch (error) {
        console.error("Error calling Google Generative AI API:", error);
        throw new Error(`Failed to get AI review: ${error.message}`);
    }
};