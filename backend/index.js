import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';

import userRouter from './routes/user.route.js';
import authRouter from './routes/auth.route.js';
import problemRoutes from './routes/problemRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';

import cookieParser from 'cookie-parser';

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

app.use(express.json());
app.use(cookieParser());

// Route handlers
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}!`);
});
