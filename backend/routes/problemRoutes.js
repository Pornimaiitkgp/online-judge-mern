// server/routes/problemRoutes.js

import express from 'express';
const router = express.Router();
import { createProblem, getAllProblems, getProblemById } from '../controllers/problemController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js'; // Assuming your auth middleware

// Route for creating a problem (requires admin role)
router.post('/', authenticateUser, authorizeRoles('admin'), createProblem); // You'll need to define 'admin' role in your user model and auth middleware

// Routes for getting all problems and a specific problem (public)
router.get('/', getAllProblems);
router.get('/:id', getProblemById);

export default router;