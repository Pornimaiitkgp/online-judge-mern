import express from 'express';
import mongoose from 'mongoose';

import dotenv from 'dotenv';
import userRouter from './routes/user.route.js';
import authRouter from './routes/auth.route.js';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.route.js'; // Notice the .js extension!
import problemRoutes from './routes/problemRoutes.js'; // Notice the .js extension!

dotenv.config();

mongoose
  .connect(process.env.MONGO)
  .then(() => {
    console.log('Connected to MongoDB!');
  })
  .catch((err) => {
    console.log(err);
  });


// server/server.js (or app.js)



dotenv.config();


const app = express();
app.use(express.json()); // Body parser

// ... other middleware like CORS if you have it ...

app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes); // Integrate problem routes

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.use(express.json());

app.use(cookieParser());

app.listen(3000, () => {
  console.log('Server is running on port 3000!');
});

app.use('/api/user', userRouter);
app.use('/api/auth', authRouter);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});



