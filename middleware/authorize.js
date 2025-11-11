// middleware/authorize.js
import { errorRes } from '../utils/errorResponse.js';


export const authorize = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return errorRes(
                res, 
                'FORBIDDEN', 
                'You do not have permission to access this resource', 
                403, 
                {}, 
                req.originalUrl
            );
        }
        next(); 
    };
};