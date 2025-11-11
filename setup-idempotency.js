import { pool } from './config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run SQL Migration for Idempotency
 * Usage: node setup-idempotency.js
 */

async function runMigration() {
    try {
        console.log('📝 Starting Idempotency Migration...\n');

        // SQL Commands
        const sqlCommands = [
            `CREATE TABLE IF NOT EXISTS idempotency_keys (
                id INT AUTO_INCREMENT PRIMARY KEY,
                \`key\` VARCHAR(255) NOT NULL UNIQUE,
                userId INT NOT NULL,
                response LONGTEXT NOT NULL,
                statusCode INT DEFAULT 201,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_key_user (\`key\`, userId),
                INDEX idx_createdAt (createdAt)
            );`,
            
            `CREATE EVENT IF NOT EXISTS cleanup_idempotency_keys
             ON SCHEDULE EVERY 1 DAY
             DO
                 DELETE FROM idempotency_keys 
                 WHERE createdAt < DATE_SUB(NOW(), INTERVAL 24 HOUR);`
        ];

        // Execute each command
        for (const sql of sqlCommands) {
            console.log('⏳ Executing: ' + sql.substring(0, 50) + '...');
            await pool.query(sql);
            console.log('✅ Success!\n');
        }

        // Verify table created
        const [tables] = await pool.query('SHOW TABLES LIKE "idempotency_keys"');
        if (tables.length > 0) {
            console.log('✅ idempotency_keys table created successfully!');
            
            // Show table structure
            const [columns] = await pool.query('DESCRIBE idempotency_keys');
            console.log('\n📋 Table Structure:');
            columns.forEach(col => {
                console.log(`   - ${col.Field}: ${col.Type}`);
            });
        } else {
            console.log('❌ Failed to create table');
        }

        console.log('\n✅ Migration completed successfully!');
        process.exit(0);

    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
}

// Run migration
runMigration();
