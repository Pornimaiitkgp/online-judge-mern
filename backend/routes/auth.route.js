import express from 'express';
import { google, signin, signup, signOutUser} from '../controllers/auth.controller.js';

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post('/google', google);
router.post('/signout', signOutUser);

export default router;

