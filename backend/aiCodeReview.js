import { GoogleGenAI } from "@google/genai";

import dotenv from 'dotenv';dotenv.config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const aiCodeReview= async (code) => {
    const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `Check the following code for errors or bugs.
    Code: ${code}`,
  });
  console.log(response.text);
  return response.text;

};


