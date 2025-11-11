import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

// Rate limit store (ใน production ให้ใช้ Redis)
const store = new Map();

// Helper: Clear expired entries
const clearExpired = () => {
    const now = Date.now();
    for (const [key, value] of store.entries()) {
        if (value.resetTime <= now) {
            store.delete(key);
        }
    }
};

const getRateLimitByRole = (role) => {
    // Anonymous: 20 req/15min
    // User: 100 req/15min
    // Premium: 500 req/15min
    switch(role) {
        case 'premium':
            return 500;
        case 'user':
            return 100;
        default:
            return 20; // anonymous
    }
};

const customKeyGenerator = (req, res) => {
    // ใช้ userId ถ้า authenticated, ไม่ฉันใช้ IP address
    if (req.user && req.user.userId) {
        return `user_${req.user.userId}`;
    }
    // Use express-rate-limit helper to normalize IPv6 addresses
    const ip = req.ip || req.connection.remoteAddress;
    return ipKeyGenerator(ip);
};

const customHandler = (req, res) => {
    const limit = getRateLimitByRole(req.user?.role);
    const retryAfter = 300; // 5 minutes in seconds
    
    res.status(429).json({
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Too many requests. Try again in ${retryAfter / 60} minutes`,
            retryAfter: retryAfter,
            timestamp: new Date().toISOString()
        }
    });
};

export const rateLimitByRole = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (req, res) => {
        return getRateLimitByRole(req.user?.role);
    },
    keyGenerator: customKeyGenerator,
    handler: customHandler,
    skip: (req, res) => {
        // Skip rate limiting for admin
        return req.user?.role === 'admin';
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: true, // Enable `X-RateLimit-*` headers for compatibility
});