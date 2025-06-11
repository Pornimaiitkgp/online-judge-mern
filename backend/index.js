
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { aiCodeReview } from './aiCodeReview.js'; // Import your AI code review function
import Problem from './models/Problem.js'; // <--- NEW: Import your Problem model

import userRouter from './routes/user.route.js';
import authRouter from './routes/auth.route.js';
import problemRoutes from './routes/problemRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import aiRoutes from './routes/aiRoutes.js'; // Import your new AI routes (if you intend to use this for general AI tasks)


import cookieParser from 'cookie-parser';
import cors from 'cors';

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

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL.split(','),
  'ojudge-fa3bc.firebaseapp.com',
  'ojudge-fa3bc.web.app',
  'https://oj-frontend-pjqglvfqz-pornima-gaikwads-projects.vercel.app',
  'https://oj-frontend-psi.vercel.app'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});



// Route handlers
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/ai', aiRoutes); // Ensure this route is corectly handled in your aiRoutes.js if needed separately

app.get('/', (req, res) => {
    res.send('API is running...');
});

// --- Judge Proxy Endpoint ---
const JUDGE_SERVER_URL = process.env.JUDGE_SERVER_URL;



app.post('/api/judge', async (req, res, next) => {
    const submissionData = req.body;

    console.log('Backend: Received submission from frontend. Forwarding to Judge Server...');

    try {
        const judgeResponse = await fetch(`${JUDGE_SERVER_URL}/judge/cpp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(submissionData)
        });

        if (!judgeResponse.ok) {
            const errorBody = await judgeResponse.json();
            console.error('Backend: Judge Server returned an error:', errorBody);
            return res.status(judgeResponse.status).json(errorBody);
        }

        const judgeResult = await judgeResponse.json();

        console.log('Backend: Received result from Judge Server. Sending to frontend.');
        res.json(judgeResult);

    } catch (error) {
        console.error('Backend: Error forwarding to Judge Server or processing:', error);
        next({ statusCode: 500, message: 'Internal Server Error during judging process', details: error.message });
    }
});
// --- END Judge Proxy Endpoint ---

// AI Review Endpoint (directly defined in server.js)
app.post("/ai-review", async (req,res) => {
  // <--- MODIFIED: Destructure problemId from req.body ---
  const { code, problemId } = req.body; 

  if(code === undefined || code.trim() === "") {
    return res.status(400).json({ success: false, message: "Code is required for AI review." });
  }
  if(!problemId) { // <--- NEW: Check if problemId is provided
      return res.status(400).json({ success: false, message: "problemId is required for contextual AI review." });
  }

  try {
    // <--- NEW: Fetch problem statement from DB ---
    const problem = await Problem.findById(problemId);
    if (!problem) {
        return res.status(404).json({ success: false, message: "Problem not found for AI review." });
    }
    const problemStatement = problem.description; // Assuming 'description' holds the problem statement
    // <--- END NEW ---

    // <--- MODIFIED: Pass problemStatement to aiCodeReview ---
    const review= await aiCodeReview(code, problemStatement);
    res.status(200).json({"result": review});
      }
      catch (error) {
        console.error("Error during AI code review:", error); // Log the actual error
        res.status(500).json({ success: false, error: error.message || error.toString() || 'An error occurred during AI code review' });
    }
  });


// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const response = {
    success: false,
    statusCode,
    message,
  };
  if (process.env.NODE_ENV === 'development') {
      response.details = err.details || err.message;
  }
  return res.status(statusCode).json(response);
});

// Start server
const PORT = process.env.PORT || 3000; // Assuming frontend expects 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}!`);
});