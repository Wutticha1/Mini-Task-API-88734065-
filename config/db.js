// config/db.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

// pool.getConnection()
//     .then(() => console.log('Connected!!!'))
//     .catch(() => console.error('❌ Database connection failed:', err));