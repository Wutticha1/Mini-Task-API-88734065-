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

// ============================== Get ====================================

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

// ============================== GetById ================================

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

// ================================ POST ==================================

export const createUser = async (req, res) => {
    try {
        const { name, email, password, role='user' } = req.body;
        // vALIDATION
        if (!name || !email || !password) {
            return errorRes(
                res,
                'VALIDATION_ERROR',
                'Missing required fields',
                400,
                {
                    name: !name ? 'Name is required' : undefined,
                    email: !email ? 'Email is required' : undefined,
                    password: !password ? 'Password is required' : undefined
                },
                req.originalUrl
            );
        }

        // Duplicate email (409 Conflict)
        const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return errorRes(
                res, 
                'CONFLICT',
                'Email already exists',
                409,
                { email },
                req.originalUrl
            );
        }

        const [result] = await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, password, role]
        );
        res.status(201).json({ id: result.insertId, name, email, role });
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


// ============================== PUT =================================

export const updateUser = async (req, res) => {
    try {
        const { name, email, role, password } = req.body;
        const {id} = req.params;

        if(!name || !email || !role || !password) {
            return errorRes(
                res,
                'VALIDATION_ERROR',
                'Missing required fields',
                400,
                {
                    name: !name ? 'Name is required': undefined,
                    email: !email ? 'Email is required' : undefined,
                    role: !role ? 'Role is required' : undefined,
                    password: !password ? 'Password is required' : undefined
                },
                req.originalUrl
            );
        }

        const [result] = await pool.query('UPDATE users SET name=?, email=?, role=? WHERE id=?', [name, email, role, id]);
        
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
        
        res.json({ message: 'User updated successfully' });

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

// =========================== DELETE ==================================

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