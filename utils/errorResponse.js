export const errorRes = (res, code, message, status, details = {}, path = '') => {
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