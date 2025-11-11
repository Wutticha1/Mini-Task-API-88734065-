import { errorRes } from '../utils/errorResponse.js';

export const requiredPremium = (req, res, next) => {
    const { isPremium, subscriptionExpiry } = req.user || {};

    // Normalize isPremium: accept boolean true, numeric 1, or string '1' / 'true'
    const hasPremium = isPremium === true || isPremium === 1 || isPremium === '1' || String(isPremium).toLowerCase() === 'true';

    if (!hasPremium) {
        return errorRes(res, 'PREMIUM_REQUIRED', 'You must be a premium member', 403, {}, req.originalUrl);
    }

    // Parse subscriptionExpiry safely. It may be null/undefined, a Date, or a DB datetime string.
    if (!subscriptionExpiry) {
        return errorRes(res, 'SUBSCRIPTION_EXPIRED', 'Your premium membership has expired', 403, {}, req.originalUrl);
    }

    const expiry = subscriptionExpiry instanceof Date ? subscriptionExpiry : new Date(subscriptionExpiry);

    if (isNaN(expiry.getTime())) {
        // Invalid date value stored
        return errorRes(res, 'INVALID_SUBSCRIPTION_EXPIRY', 'Invalid subscription expiry date', 500, {}, req.originalUrl);
    }

    if (expiry.getTime() <= Date.now()) {
        return errorRes(res, 'SUBSCRIPTION_EXPIRED', 'Your premium membership has expired', 403, {}, req.originalUrl);
    }

    // All good
    next();
};