-- SQL Migration for Idempotency Feature
-- Run this in MySQL/MariaDB

-- Create idempotency_keys table
CREATE TABLE IF NOT EXISTS idempotency_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    `key` VARCHAR(255) NOT NULL UNIQUE,
    userId INT NOT NULL,
    response LONGTEXT NOT NULL,
    statusCode INT DEFAULT 201,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_key_user (`key`, userId),
    INDEX idx_createdAt (createdAt)
);

-- Optional: Add cleanup trigger (expires after 24 hours)
-- This will automatically clean up old idempotency keys
CREATE EVENT IF NOT EXISTS cleanup_idempotency_keys
ON SCHEDULE EVERY 1 DAY
DO
    DELETE FROM idempotency_keys 
    WHERE createdAt < DATE_SUB(NOW(), INTERVAL 24 HOUR);
