// routes/authRoutes.js
import express from 'express';
import { register, login, refresh, logout } from '../controllers/authControllers.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout); // 

export default router;