import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch'; // <--- NEW: Import node-fetch for making HTTP requests
import { aiCodeReview } from './aiCodeReview.js'; // Import your AI code review function

import userRouter from './routes/user.route.js';
import authRouter from './routes/auth.route.js';
import problemRoutes from './routes/problemRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import aiRoutes from './routes/aiRoutes.js'; // Import your new AI routes


import cookieParser from 'cookie-parser';
import cors from 'cors'; // <--- NEW: Import cors for Cross-Origin Resource Sharing


// Resolve __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

// Check if .env exists and log MONGO URI
console.log('Checking if .env file exists:', fs.existsSync(envPath));
console.log('Mongo URI:', process.env.MONGO);

// Connect to MongoDB
mongoose.connect(process.env.MONGO)
  .then(() => console.log('Connected to MongoDB!'))
  .catch((err) => console.error('MongoDB connection error:', err));

const app = express();

// --- NEW: CORS Configuration ---
// Allow requests from your frontend's origin.
// In development, you can use '*' for simplicity, but in production,
// replace with your actual frontend domain (e.g., 'http://localhost:5173' if using Vite, or 'http://localhost:3000' for Create React App default)
// Adjust the origin below to match where your React frontend is running.
// If your frontend is served from 'http://localhost:5173', use that.
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // <--- IMPORTANT: Set this to your frontend's URL
  credentials: true // Allow cookies to be sent
}));
// --- END NEW: CORS Configuration ---


app.use(express.json());
app.use(cors());
app.use(cookieParser());


// Route handlers
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

// --- NEW: Judge Proxy Endpoint ---
const JUDGE_SERVER_URL = 'http://localhost:3001'; // Your Judge Server's URL

app.post('/api/judge', async (req, res, next) => {
    const submissionData = req.body; // This contains code, language, testCases from frontend

    // Optional: Add logging or database saving for the submission here
    console.log('Backend: Received submission from frontend. Forwarding to Judge Server...');
    // console.log('Submission Data:', submissionData); // Uncomment for debugging

    try {
        // Forward the submission data directly to the Judge Server
        const judgeResponse = await fetch(`${JUDGE_SERVER_URL}/judge/cpp`, { // Call your Judge Server's C++ endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(submissionData)
        });

        if (!judgeResponse.ok) {
            // If the Judge Server returns an error status (e.g., 500)
            const errorBody = await judgeResponse.json();
            console.error('Backend: Judge Server returned an error:', errorBody);
            return res.status(judgeResponse.status).json(errorBody);
        }

        const judgeResult = await judgeResponse.json();

        // Optional: Here you can save judgeResult to your MongoDB database
        // for tracking submission history, updating problem stats, etc.
        // Example:
        // await SubmissionModel.findByIdAndUpdate(submissionId, { verdict: judgeResult.verdict, output: judgeResult.actualOutput });

        console.log('Backend: Received result from Judge Server. Sending to frontend.');
        res.json(judgeResult); // Send the Judge Server's result back to the frontend

    } catch (error) {
        console.error('Backend: Error forwarding to Judge Server or processing:', error);
        // Pass the error to the global error handler
        next({ statusCode: 500, message: 'Internal Server Error during judging process', details: error.message });
    }
});
// --- END NEW: Judge Proxy Endpoint ---

app.post("/ai-review", async (req,res) => {
  const { code } = req.body;
  if(code === undefined || code.trim() === "") {
    return res.status(400).json({ success: false, message: "Code is required for AI review." });
  }
  try {
    const review= await aiCodeReview(code);
    res.status(200).json({"result": review});
      }
      catch (error) {
        res.status(500).json({ success: false, error: error.message || error.toSring() || 'An error occured during executing code' });
     
    }
  });



// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  // Include error details in development mode for debugging
  const response = {
    success: false,
    statusCode,
    message,
  };
  if (process.env.NODE_ENV === 'development') { // Add this check
      response.details = err.details || err.message;
  }
  return res.status(statusCode).json(response);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}!`);
});