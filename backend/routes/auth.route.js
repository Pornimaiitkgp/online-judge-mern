import express from 'express';
import { google, signOut, signin, signup} from '../controllers/auth.controller.js';

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post('/google', google);
router.post('/signout', signOut);

router.get('/google', (req, res) => {
  res.status(405).json({ message: 'Method Not Allowed' });
});

export default router;

