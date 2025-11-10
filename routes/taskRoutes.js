import express from 'express';
import {
    createTask,
    updateTask,
    getTasks,
    getTaskById,
    updateTaskStatus,
    deleteTask
} from '../controllers/taskControllers.js';

const router = express.Router();

router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', createTask);
router.put('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus);
router.delete('/:id', deleteTask);

export default router;
