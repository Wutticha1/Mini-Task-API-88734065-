import { pool } from '../config/db.js';
import { errorRes } from '../utils/errorResponse.js';

/**
 * Idempotency Middleware for POST /tasks
 * 
 * Features:
 * - Store idempotency key in database (expire 24 hours)
 * - If key exists: return cached response
 * - If key is new: process request normally
 */

export const idempotencyMiddleware = async (req, res, next) => {
    // Only apply to POST /tasks
    if (req.method !== 'POST' || !req.path.includes('/tasks')) {
        return next();
    }

    const idempotencyKey = req.headers['idempotency-key'];

    // Idempotency-Key is required for POST /tasks
    if (!idempotencyKey) {
        return errorRes(
            res,
            'MISSING_IDEMPOTENCY_KEY',
            'Idempotency-Key header is required for POST requests',
            400,
            { header: 'idempotency-key' },
            req.originalUrl
        );
    }

    try {
        // ตรวจสอบว่ามี idempotency key นี้อยู่ใน DB หรือไม่
        const [existing] = await pool.query(
            'SELECT response, createdAt FROM idempotency_keys WHERE key = ? AND userId = ?',
            [idempotencyKey, req.user.userId]
        );

        if (existing.length > 0) {
            const createdAt = new Date(existing[0].createdAt).getTime();
            const now = Date.now();
            const expirationTime = 24 * 60 * 60 * 1000; // 24 hours

            // Check if key is expired
            if (now - createdAt > expirationTime) {
                // ลบ key ที่หมดอายุแล้ว
                await pool.query('DELETE FROM idempotency_keys WHERE key = ?', [idempotencyKey]);
                // ให้ continue ไปสร้างใหม่
            } else {
                // Return cached response
                const cachedResponse = JSON.parse(existing[0].response);
                return res.status(cachedResponse.statusCode || 201).json(cachedResponse.body);
            }
        }

        // Store response in res for later use
        const originalJson = res.json.bind(res);
        res.json = function(data) {
            res._body = data;
            return originalJson(data);
        };

        // Store statusCode
        const originalStatus = res.status.bind(res);
        res.status = function(code) {
            res._statusCode = code;
            return originalStatus(code);
        };

        // ก่อน next() เสร็จ, เราจะบันทึก response
        const originalEnd = res.end.bind(res);
        res.end = async function() {
            try {
                if (res._body && res._statusCode) {
                    // Store idempotency key with response
                    await pool.query(
                        'INSERT INTO idempotency_keys (key, userId, response, statusCode, createdAt) VALUES (?, ?, ?, ?, NOW())',
                        [idempotencyKey, req.user.userId, JSON.stringify(res._body), res._statusCode]
                    );
                }
            } catch (err) {
                console.error('Idempotency key storage error:', err);
            }
            return originalEnd();
        };

        next();
    } catch (err) {
        console.error(err);
        return errorRes(res, 'INTERNAL_SERVER_ERROR', 'Internal server error', 500, { error: err.message }, req.originalUrl);
    }
};
