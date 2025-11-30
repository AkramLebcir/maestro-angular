# حل سريع لمشكلة Migration

## المشكلة
```
error: column "ownerId" of relation "labs" contains null values
```

## الحل السريع (3 خطوات)

### 1. أوقف Backend
```bash
pkill -f "nest start"
```

### 2. شغّل Migration Script
```bash
cd nest-backend
npm run migrate:multitenant
```

### 3. شغّل Backend من جديد
```bash
npm run start:dev
```

## بعد Migration

سجل دخول باستخدام:
- **Email:** `admin@default.com`
- **Password:** `admin123456`

⚠️ **مهم جداً:** غيّر كلمة المرور بعد أول تسجيل دخول!

## إذا فشل Migration Script

### حل بديل: Migration يدوي

1. **اتصل بقاعدة البيانات:**
   ```bash
   psql -h localhost -p 15432 -U postgres -d nest_db
   ```

2. **أنشئ مستخدم admin (إذا لم يكن موجوداً):**
   ```sql
   -- احصل على bcrypt hash لكلمة "admin123456"
   -- يمكنك استخدام: node -e "const bcrypt=require('bcrypt');bcrypt.hash('admin123456',10).then(h=>console.log(h))"
   
   INSERT INTO users (email, "passwordHash", role, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
   VALUES (
     'admin@default.com',
     '$2b$10$rKqXqXqXqXqXqXqXqXqXeXqXqXqXqXqXqXqXqXqXqXqXqXqXqXqXq', -- استبدل بـ hash حقيقي
     'admin',
     'Default',
     'Admin',
     true,
     NOW(),
     NOW()
   ) ON CONFLICT (email) DO NOTHING;
   ```

3. **احصل على ID المستخدم:**
   ```sql
   SELECT id FROM users WHERE email = 'admin@default.com';
   -- لاحظ الـ ID (مثلاً: 1)
   ```

4. **أضف ownerId لكل جدول (استبدل 1 بـ ID المستخدم):**
   ```sql
   -- مثال لجدول labs
   ALTER TABLE labs ADD COLUMN "ownerId" integer;
   UPDATE labs SET "ownerId" = 1;
   ALTER TABLE labs ALTER COLUMN "ownerId" SET NOT NULL;
   ALTER TABLE labs ADD CONSTRAINT "FK_labs_owner" 
     FOREIGN KEY ("ownerId") REFERENCES users(id) ON DELETE CASCADE;
   ```

5. **كرر الخطوة 4 لجميع الجداول:**
   - labs, classes, students, attendance, notebooks, topics, timetable, behavior_events, grades, workstations, annual_distribution, holiday_periods, progress_tracking, pedagogical_documents, lab_inventory_items, lab_equipment, lab_software, lab_furniture, lab_cleaning_logs, computer_checklists, lab_device_logs, topic_elements, subjects

## حل بديل: حذف البيانات وبدء من جديد

⚠️ **تحذير:** سيحذف جميع البيانات!

```bash
# أوقف Backend
pkill -f "nest start"

# احذف قاعدة البيانات
cd nest-backend
docker-compose down -v
docker-compose up -d

# شغّل Backend (سيُنشئ الجداول تلقائياً)
npm run start:dev

# أنشئ مستخدم admin
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123456",
    "role": "admin",
    "firstName": "Admin",
    "lastName": "User"
  }'
```


