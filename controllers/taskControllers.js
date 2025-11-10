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
        let query = 'SELECT * FROM tasks WHERE 1=1';
        const params = [];

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
        const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
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

        res.json(rows[0])

    } catch(err) {
        console.error(err);
        errorRes(res, 'INTERNAL_SERVER_ERROR', 'Internal server error', 500, {error: err.message}, req.originalUrl);
    }
};


// ========================================== POST (Idempotent)====================================================

// เก็บ key
const usedKey = new Set();

export const createTask = async(req, res) => {
    try {
        const key = req.headers['idempotency-key'];
        if (!key) {
            return errorRes(
                res,
                'MISSING IDEMPOTENCY-KEY HEADER',
                'Missing Idempotency-Key Header',
                400,
                {},
                req.originalUrl
            );
        } 

        if(usedKey.has(key)) {
            return errorRes(
                res,
                'DUPLICATE REQUEST',
                'Idempotency-Key already used',
                409,
                {},
                req.originalUrl
            );
        }

        const { title, description, status, priority, ownerId, assignedTo, isPublic } = req.body;
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
            `INSERT INTO tasks (title, description, status, piority, ownerId, assignedTo, isPublic)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [title, description, status, priority, ownerId, assignedTo, isPublic]
        );

        usedKey.add(key);

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

export const updateTask = async(req, res) => {
    try {
        const {title, description, status, priority, assignedTo, isPublic } = req.body;
        
        // check input 
        if ( !title || !description || !status ) {
            return errorRes(
                res,
                'VALIDATION_ERROR',
                'Missing required fields',
                400,
                {
                    title: !title ? 'Title is required' : undefined,
                    description: !description ? 'Description is required' : undefined,
                    status: !status ? 'Status is required' : undefined,
                    priority: !priority ? 'Priority is required' : undefined,
                    assignedTo: !assignedTo ? 'AssignedTo is required' : undefined,
                    isPublic: !isPublic ? 'IsPublic is required' : undefined
                },
                req.originalUrl
            );
        }

        const [task] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
        if (task.length === 0) {
            return errorRes(
                res,
                'NOT_FOUND',
                'Task not found',
                404,
                {},
                req.originalUrl
            );
        }
        
        // update
        await pool.query(
            'UPDATE tasks SET title=?, description=?, status=?, piority=?, assignedTo=?, isPublic=? WHERE id=?',
            [title, description, status, priority, assignedTo, isPublic, req.params.id]
        );

        const [updatedTask] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);

        res.json({ 
            message: 'Task updated successfully', 
            task: updatedTask[0]
        });


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

// ====================================== PATCH ============================================
// Update status

export const updateTaskStatus = async(req, res) => {
    try {
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ message: "Status is required" });
        }

        const [ result ] = await pool.query(
            'UPDATE tasks SET status=? WHERE id = ?', [status, req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return errorRes(
                res,
                'TASK_NOT_FOUND',
                'Task not found',
                404,
                {},
                req.originalUrl
            );
        }
        
        res.json({message: `Task status changed to '${status}'`});

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