// middleware/authenticate.js
import jwt from 'jsonwebtoken';
import { errorRes } from '../utils/errorResponse.js'; 

export const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) {
        return errorRes(res, 'UNAUTHORIZED', 'Access token is required', 401, {}, req.originalUrl); 
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, userPayload) => {
        if (err) {
            return errorRes(res, 'FORBIDDEN', 'Invalid or expired token', 403, {}, req.originalUrl); 
        }
        
        req.user = userPayload; 
        next();
    });
};