import { pool } from '../config/db.js';
import { errorRes } from '../utils/errorResponse.js';

export const checkTaskAccess = (action) => {
  return async (req, res, next) => {
    const taskId = req.params.id;
    const { role, userId } = req.user;

    try {
      const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
      if (rows.length === 0) {
        return errorRes(res, 'NOT_FOUND', 'Task not found', 404, {}, req.originalUrl);
      }

      const task = rows[0];

      if (action === 'read') {
        if (task.isPublic || task.ownerId === userId || role === 'admin') return next();
      }

      if (action === 'write') {
        if (task.ownerId === userId || role === 'admin') return next();
      }

      return errorRes(res, 'FORBIDDEN', 'You do not have permission', 403, {}, req.originalUrl);
    } catch (err) {
      console.error(err);
      return errorRes(res, 'DB_QUERY_ERROR', 'Database error', 500, { error: err.message }, req.originalUrl);
    }
  };
};