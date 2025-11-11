// controllers/v2/taskControllers.js
import { pool } from '../../config/db.js';

// 🔧 ฟังก์ชันช่วยส่ง error response กลาง
const errorRes = (res, code, message, status, details = {}, path = '') => {
  res.status(status).json({
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      path,
    },
  });
};

// ---------------------------- GET (All Tasks) ----------------------------
export const getTasksV2 = async (req, res) => {
  try {
    const { status, priority } = req.query;
    const { userId, role } = req.user;

    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];

    // จำกัดสิทธิ์เฉพาะเจ้าของหรือ public
    if (role === 'user' || role === 'premium') {
      query += ' AND (ownerId = ? OR isPublic = 1)';
      params.push(userId);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (priority) {
      query += ' AND piority = ?';
      params.push(priority);
    }

    const [rows] = await pool.query(query, params);

    res.json({
      version: 'v2',
      total: rows.length,
      data: rows,
    });
  } catch (err) {
    console.error(err);
    errorRes(res, 'INTERNAL_SERVER_ERROR', 'Internal server error', 500, { error: err.message }, req.originalUrl);
  }
};

// ---------------------------- GET (By ID) ----------------------------
export const getTaskByIdV2 = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return errorRes(res, 'NOT_FOUND', 'Task not found', 404, {}, req.originalUrl);
    }

    res.json({
      version: 'v2',
      task: rows[0],
    });
  } catch (err) {
    console.error(err);
    errorRes(res, 'INTERNAL_SERVER_ERROR', 'Internal server error', 500, { error: err.message }, req.originalUrl);
  }
};

// ---------------------------- POST (Create Task) ----------------------------
const usedKeys = new Set();

export const createTaskV2 = async (req, res) => {
  try {
    const { title, description, status, priority, assignedTo, isPublic } = req.body;
    const { userId } = req.user;

    // ตรวจ idempotency key
    const key = req.headers['idempotency-key'];
    if (!key) {
      return errorRes(res, 'MISSING_IDEMPOTENCY_KEY', 'Missing Idempotency-Key header', 400, {}, req.originalUrl);
    }
    if (usedKeys.has(key)) {
      return errorRes(res, 'DUPLICATE_REQUEST', 'Idempotency-Key already used', 409, {}, req.originalUrl);
    }

    // ตรวจ field
    if (!title || title.trim() === '') {
      return errorRes(res, 'TITLE_REQUIRED', 'Title is required', 400, { field: 'title' }, req.originalUrl);
    }

    // ตรวจค่า valid
    const validStatus = ['pending', 'in_progress', 'completed'];
    if (status && !validStatus.includes(status)) {
      return errorRes(res, 'INVALID_STATUS', 'Invalid status value', 400, {}, req.originalUrl);
    }

    const validPriority = ['low', 'medium', 'high'];
    if (priority && !validPriority.includes(priority)) {
      return errorRes(res, 'INVALID_PRIORITY', 'Invalid priority value', 400, {}, req.originalUrl);
    }

    // Insert
    const [result] = await pool.query(
      'INSERT INTO tasks (title, description, status, piority, ownerId, assignedTo, isPublic) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, status, priority, userId, assignedTo, isPublic]
    );

    usedKeys.add(key);

    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
    res.status(201).json({
      version: 'v2',
      message: 'Task created successfully',
      task: rows[0],
    });
  } catch (err) {
    console.error(err);
    errorRes(res, 'INTERNAL_SERVER_ERROR', 'Internal server error', 500, { error: err.message }, req.originalUrl);
  }
};

// ---------------------------- PUT (Update Task) ----------------------------
export const updateTaskV2 = async (req, res) => {
  try {
    const { title, description, status, priority, assignedTo, isPublic } = req.body;

    if (!title || !description || !status) {
      return errorRes(res, 'VALIDATION_ERROR', 'Missing required fields', 400, {}, req.originalUrl);
    }

    const [result] = await pool.query(
      'UPDATE tasks SET title=?, description=?, status=?, piority=?, assignedTo=?, isPublic=? WHERE id=?',
      [title, description, status, priority, assignedTo, isPublic, req.params.id]
    );

    if (result.affectedRows === 0) {
      return errorRes(res, 'NOT_FOUND', 'Task not found', 404, {}, req.originalUrl);
    }

    const [updated] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    res.json({
      version: 'v2',
      message: 'Task updated successfully',
      task: updated[0],
    });
  } catch (err) {
    console.error(err);
    errorRes(res, 'INTERNAL_SERVER_ERROR', 'Internal server error', 500, { error: err.message }, req.originalUrl);
  }
};

// ---------------------------- PATCH (Update Status) ----------------------------
const usedPatchKeys = new Set();

export const updateTaskStatusV2 = async (req, res) => {
  try {
    const { status } = req.body;
    const { userId } = req.user;
    const key = req.headers['idempotency-key'];

    if (!status) {
      return errorRes(res, 'STATUS_REQUIRED', 'Status is required', 400, {}, req.originalUrl);
    }

    if (!key) {
      return errorRes(res, 'MISSING_IDEMPOTENCY_KEY', 'Missing Idempotency-Key header', 400, {}, req.originalUrl);
    }
    if (usedPatchKeys.has(key)) {
      return errorRes(res, 'DUPLICATE_REQUEST', 'Idempotency-Key already used', 409, {}, req.originalUrl);
    }

    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return errorRes(res, 'NOT_FOUND', 'Task not found', 404, {}, req.originalUrl);
    }

    const task = rows[0];
    if (task.ownerId !== userId) {
      return errorRes(res, 'FORBIDDEN', 'You do not own this task', 403, {}, req.originalUrl);
    }

    const [result] = await pool.query('UPDATE tasks SET status=? WHERE id=?', [status, req.params.id]);
    usedPatchKeys.add(key);

    res.json({
      version: 'v2',
      message: `Task status updated to '${status}'`,
    });
  } catch (err) {
    console.error(err);
    errorRes(res, 'INTERNAL_SERVER_ERROR', 'Internal server error', 500, { error: err.message }, req.originalUrl);
  }
};

// ---------------------------- DELETE ----------------------------
export const deleteTaskV2 = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return errorRes(res, 'NOT_FOUND', 'Task not found', 404, {}, req.originalUrl);
    }

    res.json({
      version: 'v2',
      message: 'Task deleted successfully',
    });
  } catch (err) {
    console.error(err);
    errorRes(res, 'INTERNAL_SERVER_ERROR', 'Internal server error', 500, { error: err.message }, req.originalUrl);
  }
};
