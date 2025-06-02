// server/routes/submissionRoutes.js

import express from 'express';
const router = express.Router();

import {
    createSubmission,       // This controller will now ONLY create the submission record in DB (e.g., status: 'Pending')
    getUserSubmissions,
    getSubmissionById,
    updateSubmissionDetails // <--- RENAMED: This controller will update status AND all judging results
} from '../controllers/submissionController.js';
import { authenticateUser } from '../middleware/authMiddleware.js'; // Assuming authorizeRoles is not directly needed on these endpoints for now

// Create a new submission record in the database.
// The frontend calls this first. It saves the code, language, problemId, etc.
// The submission will initially have a 'Pending' status.
router.post('/', authenticateUser, createSubmission);

// Get submissions for the authenticated user
router.get('/me', authenticateUser, getUserSubmissions);

// Get a single submission by ID (user or admin)
router.get('/:id', authenticateUser, getSubmissionById);

// Update submission details (including status, verdict, time, memory, detailed results, etc.).
// This route will be called INTERNALLY by your main backend's '/api/judge' route
// after it receives the full judging results from the Docker Judge Server.
router.put('/:id', authenticateUser, updateSubmissionDetails); // <--- Endpoint changed to /:id for a full update

export default router;