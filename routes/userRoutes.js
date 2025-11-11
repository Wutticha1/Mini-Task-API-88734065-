import express from 'express';
import { getUsers, getUserById, updateUser, deleteUser, getMe, updateMe, deleteMe } from '../controllers/userControllers.js'; 
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js'; 

const router = express.Router();

// Me (user) ======================
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMe);
router.delete('/me', authenticate, deleteMe);


// Admin ===========================
router.get('/', authenticate, authorize(['admin']), getUsers);
router.get('/:id', authenticate, authorize(['admin']), getUserById);
router.put('/:id', authenticate, authorize(['admin']), updateUser);
router.delete('/:id', authenticate, authorize(['admin']), deleteUser);

export default router;