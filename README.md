# Mini Task API (88734065)

โปรเจกต์นี้คือ RESTful API สำหรับระบบจัดการงาน (Task Management) ที่สร้างด้วย Express.js และ MySQL/MariaDB ตามโจทย์การบ้านวิชา 88734065 

## ✨ Features (ฟีเจอร์หลัก)

**- API Versioning:** รองรับ `/api/v1` และ `/api/v2` (ที่ให้ response พร้อม metadata)

**- Authentication:** ระบบ JWT (Access Token) พร้อม Hashing รหัสผ่าน (bcrypt) 

**- Authorization (RBAC):** แบ่ง 3 Roles: `user`, `premium`, และ `admin` 

**- Authorization (ABAC):** กำหนดสิทธิ์การเข้าถึง Task ตามเงื่อนไข (เช่น `isPublic`, `ownerId`, `isPremium`) 

**- CRUD Operations:** จัดการข้อมูล Users และ Tasks 

**- Rate Limiting:** จำกัดการใช้งานตาม Role (Anonymous, User, Premium) 

**- Idempotency:** ป้องกันการสร้าง Task ซ้ำซ้อนด้วย `Idempotency-Key`

**- Error Handling:** รูปแบบ Error Response ที่เป็นมาตรฐาน

**- Filtering & Pagination:** ค้นหา Tasks ด้วย query params (เช่น `status`) 

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
    * (ถ้ามี) รันไฟล์ Migration หรือ SQL script เพื่อสร้างตาราง `Users` และ `Tasks`

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
