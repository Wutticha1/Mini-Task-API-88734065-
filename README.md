# Mini Task API (88734065)/

โปรเจกต์นี้คือ RESTful API สำหรับระบบจัดการงาน (Task Management) ที่สร้างด้วย Express.js และ MySQL/MariaDB ตามโจทย์การบ้านวิชา 88734065 

## 🛠️ Tech Stack

* Express.js 
* MySQL / MariaDB 
* JSON Web Token (JWT) 
* bcrypt 
* express-rate-limit 

## 🚀 Setup & Installation (วิธีการรัน)

1.  **Clone a repository:**
    ```bash
    git clone [MY-Repo-URL]
    cd [My-Repo-Folder]
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Setup Database:**
    * สร้าง Database ใน MySQL/MariaDB 
    ## 🗄️ Database Setup

    1.  สร้าง Database ใน MySQL/MariaDB (เช่น ชื่อ `task_api_db`)
    2.  รัน SQL query ด้านล่างนี้เพื่อสร้างตารางที่จำเป็น:

        ```sql
        -- 
        CREATE TABLE IF NOT EXISTS Users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('user', 'premium', 'admin') NOT NULL DEFAULT 'user',
            isPremium BOOLEAN DEFAULT false,
            subscriptionExpiry DATETIME,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 
        CREATE TABLE IF NOT EXISTS Tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
            priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
            ownerId INT NOT NULL,
            assignedTo INT,
            isPublic BOOLEAN DEFAULT false,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        );
        ```

4.  **Environment Variables:**
    * คัดลอกไฟล์ `.env.example` ไปเป็น `.env` 
    * แก้ไขค่าตัวแปรในไฟล์ `.env` (ดูใน `.env.example` )

5.  **Run the application:**
    ```bash
    npm run dev 
    # หรือ
    npm start
    ```

## 🔑 Environment Variables
ดูในไฟล์ `.env.example`  (ต้องมีตัวแปรสำหรับเชื่อมต่อ Database และ JWT Secrets)


