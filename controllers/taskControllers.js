import { pool } from '../config/db.js';

// Function Error Handle 
const errorRes = (res, code, message, status, details = {}, path = '') => {
    res.status(status).json({
        error: {
            code,
            message,
            details,
            timestamp: new Date().toISOString(),
            path
        }
    });
}

// =================================== GET (filter)======================================

export const getTasks = async(req, res) => {
    try {
        const { status, piority } = req.query;
        const { role, userId } = req.user;

        let query = 'SELECT * FROM tasks WHERE 1=1';
        const params = [];

        if (role === 'user') {
            query += ' AND (ownerId = ? OR isPublic = 1)';
            params.push(userId);
        } else if (role === 'premium') {
            query += ' AND (ownerId = ? OR isPublic = 1)';
            params.push(userId);
        }
        

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        if (piority) {
            query += ' AND piority = ?';
            params.push(piority);
        }

        const [rows] = await pool.query(query, params);
        if (rows.length === 0) {
            return errorRes(
                res,
                'NOT_FOUND',
                'No tasks found in the database',
                404,
                {},
                req.originalUrl
            );
        }
        res.json(rows);
    
    } catch (err) {
        console.error(err);
        errorRes(res, 'INTERNAL_SERVER_ERROR', 'Internal Server error', 500, {error: err.message}, req.originalUrl);
    }
}

// ========================================== GETById ======================================

export const getTaskById = async(req, res) => {
    try {
        const { userId, role } = req.user;
        const taskId = req.params.id;

        const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
        
        if(rows.length === 0){
            return errorRes(
                res,
                'NOT_FOUND',
                'No task found',
                404,
                {},
                req.originalUrl
            );
        }

        const task = rows[0];

        // check role
        if (role !== 'admin' && task.ownerId !== userId && !task.isPublic) {
            return errorRes(
                res,
                'FORBIDDEN',
                'You are not allowed to view this task',
                403,
                {},
                req.originalUrl
            );
        }

        res.json(task);

    } catch(err) {
        console.error(err);
        errorRes(res, 'INTERNAL_SERVER_ERROR', 'Internal server error', 500, {error: err.message}, req.originalUrl);
    }
};


// ========================================== POST (Idempotent)====================================================

export const createTask = async(req, res) => {
    try {
        
        const { title, description, status, priority, assignedTo, isPublic } = req.body;
        const { isPremium, userId } = req.user;

        if(priority === 'high' && !isPremium) {
            return errorRes(
                res,
                'FORBIDDEN',
                'Only premium users can create high priority tasks',
                403,
                {},
                req.originalUrl
            );
        }

        // Idempotency-Key already handled by middleware
        const idempotencyKey = req.headers['idempotency-key'];

        // ✅ 1. ตรวจช่องว่าง
        if (!title || title.trim() === '') {
        return errorRes(
            res,
            'TITLE_REQUIRED',
            'Title is required',
            400,
            { field: 'title' },
            req.originalUrl
        );
        }

        // ✅ 2. ตรวจค่า status ว่าถูกต้องไหม (optional)
        const validStatus = ['pending', 'in_progress', 'completed'];
        if (status && !validStatus.includes(status)) {
        return errorRes(
            res,
            'INVALID_STATUS',
            'Status must be one of: pending, in_progress, completed',
            400,
            { field: 'status', allowed: validStatus },
            req.originalUrl
        );
        }

        // ✅ 3. ตรวจค่า priority ว่าถูกต้องไหม (optional)
        const validPriority = ['low', 'medium', 'high'];
        if (priority && !validPriority.includes(priority)) {
        return errorRes(
            res,
            'INVALID_PRIORITY',
            'Priority must be one of: low, medium, high',
            400,
            { field: 'priority', allowed: validPriority },
            req.originalUrl
        );
        }

        const [result] = await pool.query(
            `INSERT INTO tasks (title, description, status, priority, ownerId, assignedTo, isPublic)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [title, description, status, priority, userId, assignedTo, isPublic]
        );

        // ✅ ดึงข้อมูลที่เพิ่ง insert กลับมา
        const [rows] = await pool.query(`SELECT * FROM tasks WHERE id = ?`, [result.insertId]);

        res.status(201).json(
            {
                message: 'Task created successfully',
                task: rows[0]
            }
        );
    
    } catch(err) {
        console.error(err);
        errorRes(res, 'INTERNAL_SERVER_ERROR', 'Internal server error', 500, {error: err.message}, req.originalUrl);
    }
};

// =========================================== PUT ================================================
// (Full update)

export const updateTask = async (req, res) => {
  try {
    const { title, description, status, priority, assignedTo, isPublic, ownerId } = req.body;

    // 1. ดึงข้อมูลเดิมของ task
    const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (tasks.length === 0) {
      return errorRes(res, 'NOT_FOUND', 'Task not found', 404, {}, req.originalUrl);
    }

    const task = tasks[0];

    // 2. ใช้ค่าที่ส่งมา ถ้าไม่มีให้ใช้ของเดิม
    const newTitle = title ?? task.title;
    const newDescription = description ?? task.description;
    const newStatus = status ?? task.status;
    const newPriority = priority ?? task.priority;
    const newAssignedTo = assignedTo ?? task.assignedTo;
    const newIsPublic = isPublic ?? task.isPublic;
    const newOwnerId = ownerId ?? task.ownerId;

    // 3. Update เฉพาะค่าที่มีการเปลี่ยน
    await pool.query(
      `UPDATE tasks 
       SET title=?, description=?, status=?, priority=?, assignedTo=?, isPublic=?, ownerId=? 
       WHERE id=?`,
      [newTitle, newDescription, newStatus, newPriority, newAssignedTo, newIsPublic, newOwnerId, req.params.id]
    );

    // 4. ดึงข้อมูลใหม่กลับไป
    const [updatedTask] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);

    res.json({
      message: 'Task updated successfully',
      task: updatedTask[0],
    });
  } catch (err) {
    console.error(err);
    errorRes(res, 'INTERNAL_SERVER_ERROR', 'Internal server error', 500, { error: err.message }, req.originalUrl);
  }
};

// ====================================== PATCH ============================================
// Update status

export const updateTaskStatus = async(req, res) => {
    try {
        const { status } = req.body;
        const { userId, role } = req.user;
        const taskId = req.params.id;
         
        if (!status) {
            return res.status(400).json({ message: "Status is required" });
        }

      let rows;
      try {
            [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
        } catch (err) {
            return errorRes(
                res,
                'DB_QUERY_ERROR',
                'Failed to fetch task from database',
                500,
                { error: err.message },
                req.originalUrl
            );
        }
        
        if(rows.length === 0) {
            return errorRes(
                res,
                'TASK_NOT_FOUND',
                'Task not found',
                404,
                {},
                req.originalUrl
            );
        }

        const task = rows[0];

        //   check authorize
        if(String(task.ownerId) !== String(userId) && role !== 'admin') {
            return errorRes(
                res,
                'FORBIDDEN',
                'You do not have permission to access this resource',
                403,
                {},
                req.originalUrl
            );
        }

         // Update status
        let result;
        try {
            [result] = await pool.query('UPDATE tasks SET status=? WHERE id=?', [status, taskId]);
        } catch (err) {
            return errorRes(
                res,
                'DB_UPDATE_ERROR',
                'Failed to update task status',
                500,
                { error: err.message },
                req.originalUrl
            );
        }

        // ตรวจสอบว่ามี row ถูก update จริงหรือไม่
        if (result.affectedRows === 0) {
            return errorRes(
                res,
                'UPDATE_FAILED',
                'Task status could not be updated',
                500,
                {},
                req.originalUrl
            );
        }

        res.json({ message: `Task status changed to '${status}'` });


    } catch (err) {
        console.error(err);
        errorRes(
             res,
            'INTERNAL_SERVER_ERROR',
            'Internal server error',
            500,
            { error: err.message },
            req.originalUrl
        );
    }
};

// ======================================== DELETE ===================================

export const deleteTask = async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return errorRes(res, 'TASK_NOT_FOUND', 'Task not found', 404, {}, req.originalUrl);
        }

        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        console.error(err)
        errorRes(
             res,
            'INTERNAL_SERVER_ERROR',
            'Internal server error',
            500,
            { error: err.message },
            req.originalUrl
        );
    }
}