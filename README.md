# Mini Task API (88736065)

โปรเจกต์นี้คือ RESTful API สำหรับระบบจัดการงาน (Task Management) ที่สร้างด้วย Express.js และ MySQL/MariaDB ตามโจทย์การบ้านวิชา 88734065

## 🛠️ Tech Stack

- Express.js
- MySQL / MariaDB (mysql2)
- JSON Web Token (JWT)
- bcryptjs
- express-rate-limit

## 🚀 Setup & Installation (วิธีการรัน)

1. Clone the repository:

```bash
git clone [MY-Repo-URL]
cd [My-Repo-Folder]
```

2. Install dependencies:

```bash
npm install
```

3. Database setup:

สร้างฐานข้อมูลใน MySQL/MariaDB (เช่น `task_api_db`) แล้วรัน migration หรือ SQL scripts ใน `database/` เช่น `database/idempotency-migration.sql` เพื่อสร้างตารางที่จำเป็น

ตัวอย่าง SQL สำหรับอ้างอิง (ดูไฟล์ migrationที่แท้จริงใน repo):

```sql
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
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

4. Environment variables:

คัดลอก `.env.example` เป็น `.env` แล้วแก้ค่า DB/JWT ตามเครื่อง

5. Run the app:

```bash
npm start
# หรือ
npm run dev
```

## 🔑 Environment Variables

ดูตัวอย่างใน `.env.example` (ต้องมี DATABASE_HOST, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME, JWT_SECRET เป็นต้น)

## การรวมสาขา `dev` -> `main`

ถ้าต้องการนำการพัฒนาจาก `dev` ขึ้น `main` ให้สร้าง Pull Request บน GitHub หรือ merge locally และแก้ข้อขัดแย้งก่อน push ขึ้น `origin/main` (README.md conflict ถูกแก้เรียบร้อยแล้ว)

---

ถ้ามีส่วนที่ต้องการให้แก้ไขเพิ่มเติมใน README หรืออยากให้ผมช่วย finalize PR บน GitHub บอกได้เลย
