// middleware/checkHighPriority.js
import { errorRes } from '../utils/errorResponse.js';

export const checkHighPriority = (req, res, next) => {
    const { priority, isPremium, role } = req.user;
    if(priority === 'high' && !isPremium && role !== 'admin') {
        return errorRes(res, 'PREMIUM_REQUIRED', 'Only premium users can create high priority tasks', 403, {}, req.originalUrl);
    }
    next();
};