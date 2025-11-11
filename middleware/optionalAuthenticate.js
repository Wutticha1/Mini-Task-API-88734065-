import jwt from 'jsonwebtoken';

// Optional authenticate: ถ้ามี Authorization header => verify และ set req.user
// ถ้าไม่มีหรือ verify ล้มเหลว จะไม่ส่ง error แต่จะผ่านไปเป็น anonymous
export const optionalAuthenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next(); // ไม่มี token -> anonymous

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      // ไม่บล็อก ถ้า token ไม่ถูกต้อง
      return next();
    }
    req.user = payload;
    next();
  });
};
