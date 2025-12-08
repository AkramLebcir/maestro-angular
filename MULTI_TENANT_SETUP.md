# نظام متعدد المستخدمين - دليل الإعداد

## ✅ ما تم إنجازه

تم تحويل التطبيق بنجاح إلى نظام متعدد المستخدمين (Multi-Tenant System) مع الميزات التالية:

### Backend (NestJS) ✅
- ✅ نظام المصادقة الكامل مع JWT
- ✅ User Entity مع Roles (Admin/Teacher)
- ✅ TenantOwnedEntity للعزل الكامل للبيانات
- ✅ Guards: JwtAuthGuard, RolesGuard, ModuleAccessGuard
- ✅ Users API: CRUD كامل + إدارة الصلاحيات
- ✅ جميع الوحدات الحالية تدعم عزل البيانات

### Frontend (Angular) ✅
- ✅ Auth Service مع إدارة JWT tokens
- ✅ Login Component
- ✅ Auth Guard & Admin Guard
- ✅ Admin Panel مع 3 أقسام:
  - إدارة المستخدمين (Users Management)
  - إدارة الصلاحيات (Module Access)
  - المتابعة والإشراف (Monitoring)
- ✅ تحديث Header مع معلومات المستخدم وزر Logout
- ✅ تحديث API Service لإضافة JWT headers تلقائياً
- ✅ Route Protection لجميع الصفحات

## 🚀 كيفية الاستخدام

### 1. إنشاء حساب مسؤول أولي

قم بتشغيل Backend ثم استخدم API لإنشاء أول مسؤول:

```bash
POST /api/users
{
  "email": "admin@example.com",
  "password": "admin123456",
  "role": "admin",
  "firstName": "المسؤول",
  "lastName": "الرئيسي"
}
```

### 2. تسجيل الدخول

افتح التطبيق وانتقل إلى `/login`:
- أدخل البريد الإلكتروني أو اسم المستخدم
- أدخل كلمة المرور
- سيتم توجيهك تلقائياً:
  - المسؤول → `/admin`
  - الأستاذ → `/dashboard`

### 3. لوحة تحكم المسؤول

بعد تسجيل الدخول كمسؤول، يمكنك:

#### إدارة المستخدمين
- إنشاء حسابات جديدة للأساتذة
- تعديل بيانات المستخدمين
- تفعيل/تعطيل الحسابات
- حذف المستخدمين

#### إدارة الصلاحيات
- اختيار أستاذ
- تفعيل/إلغاء تفعيل الوحدات (Modules) لكل أستاذ
- الوحدات المتاحة:
  - classes, students, attendance, grades
  - notebooks, topics, timetable
  - progress-tracking, pedagogical-docs
  - training-inspection, annual-distribution
  - behavior, labs, lab-management

#### المتابعة والإشراف
- عرض قائمة جميع المستخدمين
- آخر تسجيل دخول لكل مستخدم
- حالة الحساب (نشط/معطل)
- البحث عن مستخدمين

## 🔒 الأمان

- ✅ كلمات المرور مشفرة باستخدام bcrypt
- ✅ JWT tokens للجلسات
- ✅ عزل كامل للبيانات (كل أستاذ يرى بياناته فقط)
- ✅ Route Guards لحماية الصفحات
- ✅ Module Access Control (التحكم في الوحدات)

## 📝 ملاحظات مهمة

1. **البيانات الحالية**: إذا كان لديك بيانات موجودة، يجب ربطها بحساب مسؤول أولي
2. **JWT Secret**: تأكد من تعيين `JWT_SECRET` في ملف `.env`
3. **BCrypt Salt**: يمكن تعيين `BCRYPT_SALT_ROUNDS` (افتراضي: 10)

## 🔄 الخطوات التالية (اختيارية)

- [ ] إضافة Refresh Tokens
- [ ] إضافة Password Reset
- [ ] إضافة Email Verification
- [ ] إضافة Audit Logs
- [ ] إضافة Two-Factor Authentication

## 📞 الدعم

للمساعدة أو الاستفسارات، راجع الكود المصدري أو تواصل مع فريق التطوير.





