// server/routes/submissionRoutes.js

import express from 'express'; 
const router = express.Router();

import {
    createSubmission,
    getUserSubmissions,
    getSubmissionById,
    updateSubmissionStatus
} from '../controllers/submissionController.js'; 
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js'; 
// Create a new submission (user must be authenticated)
router.post('/', authenticateUser, createSubmission);

// Get submissions for the authenticated user
router.get('/me', authenticateUser, getUserSubmissions);

// Get a single submission by ID (user or admin)
router.get('/:id', authenticateUser, getSubmissionById);

// Update submission status - THIS IS AN INTERNAL ROUTE FOR THE JUDGE SERVICE
// You MUST add specific authentication/authorization here later (e.g., API key, internal network check)
// For development, we'll keep it simple, but this is a critical security point.
router.put('/:id/status', updateSubmissionStatus);

export default router;