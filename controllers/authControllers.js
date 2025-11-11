import { pool } from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken } from '../utils/token.js';
import { errorRes } from '../utils/errorResponse.js';

// Token Blacklist for Logout (in-memory) - ใน production ให้ใช้ Redis
const tokenBlacklist = new Set();



// ===================== Register ==================
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if(!name || !email || !password ) {
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

        const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if(existing.length > 0) {
            return errorRes(res, 'CONFLICT', 'Email already exists', 409, { email }, req.originalUrl);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(password, salt);

        const [result] = await pool.query(
            'INSERT INTO users (name, email, password, role, isPremium, subscriptionExpiry) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, hashedPass, 'user', false, null]
        );

        const [newUser] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ?', [result.insertId]);
        
        res.status(201).json({
            message: "User registered successfully",
            user: newUser[0]
        });
    
    
    } catch (err) {
        console.error(err);
        errorRes(res, 'INTERNAL_SERVER_ERROR', 'Internal server error', 500, {error: err.message}, req.originalUrl);
    }
}; 

//  ========================== Login ========================
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if(!email || !password) {
            return errorRes(
                res, 
                'VALIDATION_ERROR', 
                'Email and password are required', 
                400, 
                {
                    email: !email ? 'Email is required' : undefined,
                    password: !password ? 'Password is required' : undefined
                }, 
                req.originalUrl
            );
        }

        // Find user
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return errorRes(res, 'UNAUTHORIZED', 'Invalid credentials (email)', 401, {}, req.originalUrl);
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return errorRes(res, 'UNAUTHORIZED', 'Invalid credentials (password)', 401, {}, req.originalUrl);
        }

        // Generate Token
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res.json({
            message: "Login successful",
            accessToken,
            refreshToken
        });

    } catch (err) {
        console.error(err);
        errorRes(res, 'INTERNAL_SERVER_ERROR', 'Internal server error', 500, {error: err.message}, req.originalUrl);
    }
}; 


//  ======================== Refresh =====================
export const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        // 1. ตรวจสอบว่ามี Refresh Token ส่งมาหรือไม่
        if (!refreshToken) {
            return errorRes(res, 'BAD_REQUEST', 'Refresh token is required', 400, {}, req.originalUrl);
        }

        // ถ้า Token นี้ถูก Logout ไปแล้ว (อยู่ใน Blacklist)
        if (tokenBlacklist.has(refreshToken)) {
            return errorRes(res, 'UNAUTHORIZED', 'Refresh token has been blacklisted. Please login again.', 401, {}, req.originalUrl);
        }

        let userPayload;

        // 3. ตรวจสอบความถูกต้องของ Refresh Token
        try {
            userPayload = jwt.verify(refreshToken, process.env.JWT_SECRET);
        } catch (err) {
            // ถ้า Token ผิดพลาด (เช่น หมดอายุ, ไม่ถูกต้อง)
            return errorRes(res, 'FORBIDDEN', 'Invalid or expired refresh token', 403, {}, req.originalUrl);
        }

        // 4. ดึงข้อมูล User ปัจจุบันจาก Database
        // (เผื่อ User ถูกลบ หรือ Role เปลี่ยน)
        const [users] = await pool.query('SELECT id, name, email, role, isPremium, subscriptionExpiry FROM users WHERE id = ?', [userPayload.userId]);

        if (users.length === 0) {
            return errorRes(res, 'NOT_FOUND', 'User associated with this token not found', 404, {}, req.originalUrl);
        }
        
        const user = users[0];

        // 5. ออก Access Token ใหม่
        const newAccessToken = generateAccessToken(user);

        res.json({
            message: "Access token refreshed successfully",
            accessToken: newAccessToken
        });
        
    } catch (err) {
        console.error(err);
        errorRes(res, 'INTERNAL_SERVER_ERROR', 'Internal server error', 500, {error: err.message}, req.originalUrl);
    }
};

// ==============================
// Logout
// ==============================
export const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return errorRes(res, 'BAD_REQUEST', 'Refresh token is required to logout', 400, {}, req.originalUrl);
        }

        // เมื่อ Token นี้ถูกใช้เพื่อ Refresh ในอนาคต, มันจะถูกปฏิเสธ (ตาม Logic ในฟังก์ชัน refresh)
        tokenBlacklist.add(refreshToken);
        
        //
        res.status(200).json({ message: "Logged out successfully" });
        
    } catch (err) {
        console.error(err);
        errorRes(res, 'INTERNAL_SERVER_ERROR', 'Internal server error', 500, {error: err.message}, req.originalUrl);
    }
};