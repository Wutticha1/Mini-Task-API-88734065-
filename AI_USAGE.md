# การใช้ AI ในโปรเจกต์ Task Management API

---

## 1. เครื่องมือ AI ที่ใช้
- **ChatGPT (GPT-4 / GPT-5-mini)**  
  ใช้ช่วยสร้างโค้ด แนะนำโครงสร้าง และออกแบบระบบ

---

## 2. ขอบเขตการช่วยเหลือของ AI

| ส่วน | รายละเอียด |
|------|-------------|
| **Middleware** | ช่วยสร้าง `checkTaskAccess.js` (ABAC) และ `errorResponse.js` |
| **Controllers** | ช่วยสร้าง `taskControllersV2.js` พร้อม error handling และ idempotency |
| **Design Logic** | แนะนำ logic ของ RBAC + ABAC, rate limiting, และ idempotency |
| **Idenpotency-Key** | สร้างมาให้พร้อมใช้งาน ไฟล์ setup-idenpotency.js | 
| **API.md** | ทำเอกสารสรุปการทดสอบทั้งหมด | 

---

## 3. ทำด้วยตัวเอง

| ส่วน | รายละเอียด | เหตุผล |
|------|-------------|--------|
| **Database Schema** | ออกแบบและสร้าง tables (`users`, `tasks`) เอง | AI ไม่สามารถเขียน SQL ที่ปลอดภัยและ optimize ได้ |
| **Authentication Flow** | ตั้ง JWT strategy (access + refresh token expiry) และการจัดการ token blacklist | AI ให้ concept แต่ต้องตัดสินใจเอง เรื่อง security best practices |
| **RBAC Structure** | กำหนด 3 roles (user, premium, admin) และสิทธิ์เฉพาะของแต่ละ role | AI ช่วยแต่ final decision ต้องตรงกับความต้องการ business logic |
| **ABAC Rules** | กำหนด 4 rules สำหรับ attribute-based control (high priority access, task ownership, subscription check, rate limits) | ต้องคิด logic ของแต่ละสถานการณ์เอง |
| **Rate Limiting Configuration** | กำหนดขีดจำกัด per role (user: 100, premium: 500, admin: unlimited) และ 15-minute window | ปรับแต่งค่า base บน requirements นั้น ๆ |
| **Error Handling Standards** | สร้าง `errorResponse.js` utility ให้ consistent format ของ error response | Validation logic และ error codes ต้องนิยาม protocol เอง |
| **Testing & Verification** | เขียน test scripts เพื่อยืนยันว่า middleware และ routes ทำงานถูกต้อง | AI ให้ template แต่การทดสอบจริงต้องทำเอง |
| **Integration & Refactoring** | นำ AI-generated code มาปรับแต่งให้ match กับ existing codebase | ต้องแก้ syntax, import paths, และ naming conventions |
| **Documentation & README** | เขียน documentation ที่ชัดเจนสำหรับการ setup, usage, และ troubleshooting | API.md, README.md, setup scripts ต้องเขียนให้ผู้อื่นเข้าใจ |


## 4. วิธีใช้ AI

1. **สร้างโค้ด (Code Generation)**  
   - สร้าง middleware แบบ reusable เช่น `checkTaskAccess`, `usageLogger`  

2. **ปรับปรุงโค้ด (Optimization)**  
   - แนะนำการใช้ `Idempotency-Key` ใน POST / PATCH  
   - แนะนำ JSON error response แบบ standardized (`errorRes()`)  

3. **Testing & Documentation**  
   - สร้าง Markdown template สำหรับ API Documentation และ Postman Collection  

4. **ออกแบบโครงสร้างระบบ (Architecture Guidance)**  
   - แนะนำ API versioning (`v1` / `v2`) แยก controllers และ routes  
   - แนะนำแยก logic ของ role-based access control ออกจาก controller

---

## 5. ข้อจำกัด

- โค้ดจาก AI **ไม่ได้ใช้โดยตรงทั้งหมด** → ต้องปรับแก้และตรวจสอบด้วยตนเอง  
- SQL query, และ environment variables 

---

## 7. สรุปการทำงานร่วมกับ AI

### AI ควรทำ ✅
- **Code Template & Skeleton** - ช่วยเริ่มต้นโค้ดจากศูนย์ 
- **Best Practices Suggestion** - แนะนำ design patterns และ optimizations
- **Documentation Drafting** - ช่วยเขียน draft แล้วปรับแต่งเอง
- **Bug Fixing Assistance** - ช่วยระบุจุดปัญหาและแนะนำวิธีแก้

### Developer ต้องทำ 👨‍💻
- **Architecture Decisions** - เลือก technology stack และ design patterns
- **Security & Validation** - ตรวจสอบ input/output และ secure codes
- **Testing & QA** - ยืนยันว่าโค้ดทำงานตรงตามความต้องการ
- **Business Logic** - นิยาม requirements และ rules ของ domain
- **Integration & Deployment** - นำโค้ดมา integrate และ deploy บน production

### Key Learnings
- 🔍 **AI เป็นช่วยเหลือ ไม่ใช่ตัวแทน** - ต้องตรวจสอบและแก้เสมอ
- 🎯 **Prompt ที่ดี = ผลลัพธ์ที่ดี** - เขียน requirement ให้ชัดเจน
- 🔐 **Security First** - อย่าใช้ AI-generated code ที่เกี่ยวกับ security โดยไม่ verify
- 📚 **Documentation Matters** - เขียน doc ให้ชัดเจนเพื่อความ maintainability
