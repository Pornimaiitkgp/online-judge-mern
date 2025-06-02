// server/routes/submissionRoutes.js

import express from 'express';
const router = express.Router();

import {
    createSubmission, // This controller will now handle the execution
    getUserSubmissions,
    getSubmissionById,
    updateSubmissionStatus
} from '../controllers/submissionController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

// Create a new submission (user must be authenticated)
// This route will now trigger the direct code execution
router.post('/', authenticateUser, createSubmission);

// Get submissions for the authenticated user
router.get('/me', authenticateUser, getUserSubmissions);

// Get a single submission by ID (user or admin)
router.get('/:id', authenticateUser, getSubmissionById);

// Update submission status - THIS IS AN INTERNAL ROUTE FOR THE JUDGE SERVICE
// (You mentioned removing judge service, so this might become less relevant or change role)
// For now, keep it as is, but consider its future use.
router.put('/:id/status', updateSubmissionStatus);

export default router;