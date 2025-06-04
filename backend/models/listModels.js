import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const listModels = async () => {
  const res = await ai.listModels();
  console.log("Available Models:");
  res.models.forEach(model => {
    console.log(`- ${model.name}`);
  });
};

listModels();
