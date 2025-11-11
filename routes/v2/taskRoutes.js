import express from 'express';
import {
  createTaskV2,
  updateTaskV2,
  getTasksV2,
  getTaskByIdV2,
  updateTaskStatusV2,
  deleteTaskV2
} from '../../controllers/v2/taskControllers.js'; // ✅ ต้องใช้ path ที่ชี้ไป v2

import { authenticate } from '../../middleware/authenticate.js';
import { rateLimitByRole } from '../../middleware/rateLimit.js';
import { checkHighPriority } from '../../middleware/checkHighPriority.js';
import { checkTaskAccess } from '../../middleware/checkTaskAccess.js';

const router = express.Router();

router.use(authenticate, rateLimitByRole);

// ---------------------- ROUTES ----------------------
// 🟢 GET (อ่านทั้งหมด)
router.get('/', checkTaskAccess('read'), getTasksV2);

// 🟢 GET (อ่านเฉพาะ ID)
router.get('/:id', checkTaskAccess('read'), getTaskByIdV2);

// 🟡 POST (สร้างใหม่)
router.post('/', checkHighPriority, checkTaskAccess('write'), createTaskV2);

// 🟠 PUT (แก้ไขทั้งหมด)
router.put('/:id', checkTaskAccess('write'), updateTaskV2);

// 🔵 PATCH (อัปเดต status)
router.patch('/:id/status', checkTaskAccess('write'), updateTaskStatusV2);

// 🔴 DELETE (ลบ)
router.delete('/:id', checkTaskAccess('delete'), deleteTaskV2);

export default router;