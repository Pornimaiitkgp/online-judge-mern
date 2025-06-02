// server/routes/submissionRoutes.js

import express from 'express';
const router = express.Router();

import {
    createSubmission,       // Use this for initial POST
    getUserSubmissions,
    getSubmissionById,
    updateSubmissionDetails // Use this for PUT (updating results after judging)
} from '../controllers/submissionController.js'; // Ensure .js extension for ES Modules

import { authenticateUser } from '../middleware/authMiddleware.js'; // Assuming you have this

// 1. Create a new submission record in the database.
//    The frontend calls this first. It saves the code, language, problemId, etc.
//    The submission will initially have a 'Pending' status.
router.post('/', authenticateUser, createSubmission); // This is the primary submission route

// 2. Get submissions for the authenticated user (e.g., submission history page)
router.get('/me', authenticateUser, getUserSubmissions);

// 3. Get a single submission by ID (used by the frontend's SubmissionResultPage)
//    This replaces the two previous /:id GET routes and consolidates.
router.get('/:id', authenticateUser, getSubmissionById);

// 4. Update submission details (including status, verdict, time, memory, detailed results, etc.).
//    This route will be called INTERNALLY by your main backend's '/api/judge' route
//    after it receives the full judging results from the Docker Judge Server.
router.put('/:id', authenticateUser, updateSubmissionDetails);

export default router; // Use export default for the router