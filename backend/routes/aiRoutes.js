// online_judge/backend/routes/aiRoutes.js

import express from 'express';
const router = express.Router();
import { getCodeReview } from '../controllers/aiController.js';
import { authenticateUser } from '../middleware/authMiddleware.js'; // Assuming you have this

// Route for getting AI code review (requires authentication)
router.post('/review-code', authenticateUser, getCodeReview);

export default router;