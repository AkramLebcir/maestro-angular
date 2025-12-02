# دليل Migration إلى Multi-Tenant System

## المشكلة
عند تشغيل Backend، TypeORM يحاول إضافة عمود `ownerId` كـ `NOT NULL` إلى جداول تحتوي على بيانات موجودة، مما يسبب خطأ:
```
error: column "ownerId" of relation "labs" contains null values
```

## الحل

### الطريقة 1: استخدام Migration Script (موصى بها)

1. **أوقف Backend** إذا كان يعمل:
   ```bash
   pkill -f "nest start"
   ```

2. **شغّل Migration Script:**
   ```bash
   cd nest-backend
   npm run migrate:multitenant
   ```

3. **النتيجة المتوقعة:**
   - سيتم إنشاء مستخدم admin افتراضي (إذا لم يكن موجوداً)
   - سيتم إضافة عمود `ownerId` لجميع الجداول
   - سيتم ربط جميع البيانات الموجودة بالمستخدم الافتراضي
   - سيتم إضافة Foreign Key constraints

4. **بعد Migration:**
   - شغّل Backend: `npm run start:dev`
   - سجل دخول باستخدام:
     - Email: `admin@default.com`
     - Password: `admin123456`
   - **⚠️ مهم جداً:** غيّر كلمة المرور بعد أول تسجيل دخول!

### الطريقة 2: Migration يدوي (إذا فشلت الطريقة 1)

1. **اتصل بقاعدة البيانات:**
   ```bash
   psql -h localhost -p 15432 -U postgres -d nest_db
   ```

2. **أنشئ مستخدم admin:**
   ```sql
   INSERT INTO users (email, "passwordHash", role, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
   VALUES (
     'admin@default.com',
     '$2b$10$...', -- استخدم bcrypt hash لكلمة مرور
     'admin',
     'Default',
     'Admin',
     true,
     NOW(),
     NOW()
   );
   ```

3. **احصل على ID المستخدم:**
   ```sql
   SELECT id FROM users WHERE email = 'admin@default.com';
   ```

4. **أضف ownerId يدوياً لكل جدول:**
   ```sql
   -- مثال لجدول labs
   ALTER TABLE labs ADD COLUMN "ownerId" integer;
   UPDATE labs SET "ownerId" = 1; -- استبدل 1 بـ ID المستخدم
   ALTER TABLE labs ALTER COLUMN "ownerId" SET NOT NULL;
   ALTER TABLE labs ADD CONSTRAINT "FK_labs_owner" 
     FOREIGN KEY ("ownerId") REFERENCES users(id) ON DELETE CASCADE;
   ```

5. **كرر الخطوة 4 لجميع الجداول:**
   - labs, classes, students, attendance, notebooks, topics, timetable, behavior_events, grades, workstations, annual_distribution, holiday_periods, progress_tracking, pedagogical_documents, lab_inventory_items, lab_equipment, lab_software, lab_furniture, lab_cleaning_logs, computer_checklists, lab_device_logs, topic_elements, subjects

### الطريقة 3: حذف البيانات وبدء من جديد (⚠️ سيحذف جميع البيانات)

إذا لم تكن البيانات مهمة:

1. **أوقف Backend:**
   ```bash
   pkill -f "nest start"
   ```

2. **احذف قاعدة البيانات:**
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

3. **شغّل Backend:**
   ```bash
   npm run start:dev
   ```

4. **أنشئ مستخدم admin أولي:**
   ```bash
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

## التحقق من نجاح Migration

بعد Migration، تحقق من:

1. **جميع الجداول تحتوي على ownerId:**
   ```sql
   SELECT table_name, column_name 
   FROM information_schema.columns 
   WHERE column_name = 'ownerId';
   ```

2. **جميع البيانات مرتبطة بمستخدم:**
   ```sql
   SELECT "ownerId", COUNT(*) 
   FROM labs 
   GROUP BY "ownerId";
   ```

3. **Foreign Keys موجودة:**
   ```sql
   SELECT constraint_name, table_name 
   FROM information_schema.table_constraints 
   WHERE constraint_name LIKE 'FK_%_owner';
   ```

## ملاحظات مهمة

- ⚠️ **احتفظ بنسخة احتياطية** من قاعدة البيانات قبل Migration
- ⚠️ **غيّر كلمة المرور الافتراضية** فوراً بعد Migration
- ⚠️ **اختبر النظام** بعد Migration للتأكد من أن كل شيء يعمل

## استكشاف الأخطاء

إذا واجهت مشاكل:

1. **تحقق من اتصال قاعدة البيانات:**
   ```bash
   psql -h localhost -p 15432 -U postgres -d nest_db
   ```

2. **تحقق من وجود جدول users:**
   ```sql
   SELECT * FROM users;
   ```

3. **تحقق من logs:**
   ```bash
   npm run start:dev
   # راقب الرسائل في console
   ```




