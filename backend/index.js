import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRouter from './routes/user.route.js';
import authRouter from './routes/auth.route.js';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.route.js'; 
import problemRoutes from './routes/problemRoutes.js'; 
import submissionRoutes from './routes/submissionRoutes.js';

dotenv.config();

mongoose
  .connect(process.env.MONGO)
  .then(() => {
    console.log('Connected to MongoDB!');
  })
  .catch((err) => {
    console.log(err);
  });

const app = express();

app.use(express.json()); 

app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRouter);
app.use('/api/auth', authRouter); 
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes); 

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}!`);
});




