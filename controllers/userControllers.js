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
};

// ==================================
// User "Me" Endpoints
// ==================================

// ============================== GetME ====================================
export const getMe = async (req, res) => {
    const userId = req.user.userId

    try {
        const [rows] = await pool.query('SELECT id, name, email, role, isPremium, subscriptionExpiry FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) {
           return errorRes(res, 'NOT_FOUND', 'No users found in the database', 404, {}, req.originalUrl);
        }
        res.json(rows[0]);

    } catch (err) {
        console.error(err);
        errorRes(res, 'INTERNAL_SERVER_ERROR', 'Internal Server error', 500, {error: err.message}, req.originalUrl);
    }
};

// ============================== UpdateMe ================================
export const updateMe = async (req, res) => {
    const userId = req.user.userId;
    const { name, email } = req.body; // แก้ไขได้ name และ email

    try {

        if (!name || !email || name.trim() === '' || email.trim() === '') {
            return errorRes(
                res,
                'VALIDATION_ERROR',
                'Name and email fields cannot be empty',
                400, // Bad Request
                {
                    name: !name || name.trim() === '' ? 'Name is required' : undefined,
                    email: !email || email.trim() === '' ? 'Email is required' : undefined
                },
                req.originalUrl
            );
        };

        const [existing] = await pool.query(
            'SELECT id FROM users WHERE email = ? AND id != ?', //
            [email, userId]
        );

        if (existing.length > 0) {
            return errorRes(
                res,
                'CONFLICT',
                'This email is already in use by another account',
                409, // Conflict
                { email: email },
                req.originalUrl
            );
        }

        const [result] = await pool.query('UPDATE users SET name=?, email=? WHERE id = ?', [name, email, userId]);
        
        if (result.affectedRows === 0) {
            return errorRes(res, 'NOT_FOUND', 'No users found', 404, {}, req.originalUrl);
        }
        const [updatedUser] = await pool.query('SELECT id, name, email FROM users WHERE id = ?', [userId]);
        res.json({
            message: 'User profile updated successfully',
            detail: updatedUser[0]
        });

    } catch (err) {
        return errorRes(res, 'INTERNAL_SERVER_ERROR', 'Internal server error', 500, {error: err.message}, req.originalUrl);
    }
};


// ============================== DeleteMe =================================
export const deleteMe = async (req, res) => {
    const userId = req.user.userId;

    try {
        const [result] = await pool.query('DELETE FROM users WHERE id=?', [userId]);
        if (result.affectedRows === 0) {
            return errorRes(res, 'NOT_FOUND', 'User not found', 404, {}, req.originalUrl);
        }

        res.json({ message: 'User account deleted successfully '});
   
    } catch (err) {
        errorRes(res, 'INTERNAL_SERVER_ERROR', 'Internal server error', 500, {error: err.message}, req.originalUrl);
    }
};   

// =========================== 
// Admin Endpoint
// ===========================

// GET /api/v1/users (Admin only) 
export const getUsers = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users');
        if (rows.length === 0) {
           return errorRes(res, 'NOT_FOUND', 'No users found in the database', 404, {}, req.originalUrl);
        }
        res.json(rows);
    } catch (err) {
        console.error(err);
        errorRes(res, 'INTERNAL_SERVER_ERROR', 'Internal Server error', 500, {error: err.message}, req.originalUrl);
    }
};

// GET /api/v1/users/:id (Admin only)
export const getUserById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return errorRes(res, 'NOT_FOUND', 'No users found', 404, {}, req.originalUrl);
        }
        res.json(rows[0]);
    } catch (err) {
        return errorRes(res, 'INTERNAL_SERVER_ERROR', 'Internal server error', 500, {error: err.message}, req.originalUrl);
    }
};

// =======================================================
// PUT /api/v1/users/:id (Admin only)
// =======================================================
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role, password, isPremium } = req.body;
        
        
        // valid exp Premium
        
        // 1. Validation (ต้องมี field หลัก)
        if (!name || !email || !role || isPremium   === undefined) {
            return errorRes(
                res,
                'VALIDATION_ERROR',
                'Missing required fields (name, email, role)',
                400,
                {   
                    name: !name ? 'Name is required' : undefined,
                    email: !email ? 'Email is required' : undefined,
                    role: !role ? 'Role is required' : undefined
                },
                req.originalUrl
            );
        }
        
        let subExp = null;
        
        if(isPremium === 1 && (role === 'premium' || role === 'admin')) {
            const now = new Date();
            const exp = new Date(now);
            exp.setDate(now.getDate() + 30);
            subExp = exp;
        }
        
        let query = 'UPDATE users SET name = ?, email = ?, role = ?, isPremium = ?, subscriptionExpiry = ?';
        const params = [name, email, role, isPremium, subExp ];
        
        if (password && password.trim() !== '') {
            //
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            query += ', password = ?'; //
            params.push(hashedPassword); //
        }
        
        query += ' WHERE id = ?'; //
        params.push(id); //

        // 3. Execute Query
        const [result] = await pool.query(query, params);

        if (result.affectedRows === 0) {
            return errorRes(res, 'NOT_FOUND', 'User not found', 404, {}, req.originalUrl);
        }

        // 4. ดึงข้อมูลล่าสุดกลับไป
        const [updatedUser] = await pool.query('SELECT id, name, email, role, isPremium, subscriptionExpiry FROM users WHERE id = ?', [id]);
        
        res.json({ 
            message: 'User updated successfully',
            user: updatedUser[0]
        });

    } catch (err) {
        // (เพิ่มการจัดการ Error กรณี email ซ้ำ (Duplicate entry))
        errorRes(res, 'INTERNAL_SERVER_ERROR', 'Internal server error', 500, {error: err.message}, req.originalUrl);
    }
};

// =======================================================
// DELETE /api/v1/users/:id (Admin only)
// =======================================================
export const deleteUser = async (req, res) => {
    try {
        const [result] =  await pool.query('DELETE FROM users WHERE id=?', [req.params.id]);
        
        if (result.affectedRows === 0) {
            return errorRes(
                res,
                'NOT_FOUND',
                'User not found', 
                404,
                {},
                req.originalUrl
            );
        }
        res.json({ message: 'User deleted successfully' });

    } catch (err) {
        errorRes(
            res,
            'INTERNAL_SERVER_ERROR',
            'Internal server error',
            500,
            {error: err.message},
            req.originalUrl
        );
    } 
};