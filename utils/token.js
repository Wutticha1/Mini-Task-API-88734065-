import jwt from 'jsonwebtoken';

// Access Token 15 minutes
export const generateAccessToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
            role: user.role,
            isPremium: user.isPremium,          
            subscribeExpiry: user.subscribeExpiry
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
};


// RefreshToken 1 Day
export const generateRefreshToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );
};

