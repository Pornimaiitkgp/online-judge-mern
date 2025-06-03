// server/routes/problemRoutes.js

import express from 'express';
const router = express.Router();
import { createProblem, getAllProblems, getProblemById, updateProblem,
    deleteProblem  } from '../controllers/problemController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js'; // Assuming your auth middleware

// Route for creating a problem (requires admin role)

// Routes for getting all problems and a specific problem (public)
router.get('/', getAllProblems);
router.get('/:id', getProblemById);
router.post('/', authenticateUser, authorizeRoles('admin'), createProblem); // You'll need to define 'admin' role in your user model and auth middleware
router.put('/:id', authenticateUser, authorizeRoles('admin'), updateProblem);   // NEW ROUTE
router.delete('/:id', authenticateUser, authorizeRoles('admin'), deleteProblem); // NEW ROUTE


export default router;