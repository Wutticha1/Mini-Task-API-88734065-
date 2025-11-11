import express from 'express';
import {
    createTask,
    updateTask,
    getTasks,
    getTaskById,
    updateTaskStatus,
    deleteTask
} from '../controllers/taskControllers.js';

import { authenticate } from '../middleware/authenticate.js';
import { optionalAuthenticate } from '../middleware/optionalAuthenticate.js';
// import { authorize } from '../middleware/authorize.js';
import { checkHighPriority } from '../middleware/checkHighPriority.js';
import { rateLimitByRole } from '../middleware/rateLimit.js';
import { checkTaskAccess } from '../middleware/checkTaskAccess.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';

const router = express.Router();


// Make authentication optional for rate limiter to detect role (if token present)
router.use(optionalAuthenticate);
router.use(rateLimitByRole);
router.use(idempotencyMiddleware); // Apply idempotency middleware

// Routes - require authentication per-route (preserve previous behavior)
router.get('/', authenticate, getTasks);
router.get('/:id', authenticate, checkTaskAccess('read'), getTaskById);

// Premium - with idempotency
router.post('/', authenticate, checkHighPriority, createTask);

// ADMIN
router.put('/:id', authenticate, checkTaskAccess('write'), updateTask);
router.patch('/:id/status', authenticate, checkTaskAccess('write'), updateTaskStatus);
router.delete('/:id', authenticate, deleteTask);

export default router;
