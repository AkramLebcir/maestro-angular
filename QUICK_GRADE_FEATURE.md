# ميزة الدرجة السريعة في مخطط المقاعد

## نظرة عامة
تم إضافة إمكانية تسجيل درجة سريعة للطالب عند الضغط على مقعده في مخطط المقاعد.

## التغييرات المنفذة

### 1. Frontend (Angular)

#### الملفات المعدلة:
- `angular-frontend/src/app/pages/seating-chart/seating-chart.component.ts`
  - إضافة حقل `quickGrade?: number | null` إلى `StudentSeat` interface
  - إضافة حقل `quickGrade?: number | null` إلى `SeatAssignmentResponse` interface
  - تحديث `buildSeatGrid()` لتحميل الدرجة السريعة من الـ API
  - تحديث `createSeatFromStudent()` لتهيئة الدرجة السريعة بـ null
  - تحديث `saveAssignments()` لحفظ الدرجة السريعة

- `angular-frontend/src/app/pages/seating-chart/seating-chart.component.html`
  - إضافة حقل إدخال الدرجة السريعة في النافذة المنبثقة (popup)
  - عرض الدرجة السريعة في بطاقة المقعد كشارة زرقاء (badge) بجانب اسم الطالب
  - نطاق الدرجة: 0-20 مع خطوات 0.5

- `angular-frontend/src/app/services/language.service.ts`
  - إضافة ترجمات جديدة:
    - `seatingChart.quickGrade`: "درجة سريعة" / "Quick Grade" / "Note rapide" ...
    - `seatingChart.optional`: "اختياري" / "Optional" / "Optionnel" ...

### 2. Backend (NestJS)

#### الملفات المعدلة:
- `nest-backend/src/workstations/seat-assignment.entity.ts`
  - إضافة عمود جديد: `quickGrade?: number | null`
  - نوع البيانات: `float` (قابل للقيم الفارغة)

- `nest-backend/src/workstations/dto/save-assignments.dto.ts`
  - إضافة حقل `quickGrade` إلى `AssignmentInput` class
  - التحقق من الصحة: `@Min(0)` و `@Max(20)`

- `nest-backend/src/workstations/workstations.service.ts`
  - تحديث `saveAssignments()` لحفظ الدرجة السريعة

#### الملفات الجديدة:
- `nest-backend/src/database/add-quick-grade-column.ts`
  - سكريبت migration لإضافة عمود `quickGrade` إلى جدول `seat_assignments`

## كيفية التشغيل

### 1. تشغيل Migration لقاعدة البيانات
```bash
cd nest-backend
npx ts-node src/database/add-quick-grade-column.ts
```

### 2. إعادة تشغيل Backend
```bash
cd nest-backend
npm run start:dev
```

### 3. إعادة تشغيل Frontend
```bash
cd angular-frontend
npm start
```

## طريقة الاستخدام

1. **افتح صفحة مخطط المقاعد** من قائمة التنقل
2. **اختر القسم والفوج** المطلوب
3. **انقر على صورة أي طالب** في المخطط
4. **ستظهر نافذة منبثقة** تحتوي على:
   - حالة الحضور
   - حالة السلوك
   - **درجة سريعة** (اختياري): يمكنك إدخال درجة من 0 إلى 20
   - ملاحظات
5. **أدخل الدرجة** واضغط "تم"
6. **ستظهر الدرجة** كشارة زرقاء بجانب اسم الطالب في بطاقة المقعد (مثال: 15/20)
7. **احفظ التوزيع** لحفظ جميع التغييرات في قاعدة البيانات

## مميزات الميزة الجديدة

- ✅ تسجيل سريع للدرجات أثناء الحصة
- ✅ عرض بصري واضح للدرجة في بطاقة المقعد
- ✅ الدرجة اختيارية (يمكن تركها فارغة)
- ✅ نطاق محدد: 0-20 مع إمكانية إدخال درجات عشرية (0.5)
- ✅ حفظ الدرجة مع بيانات المقعد الأخرى
- ✅ دعم متعدد اللغات (عربي، فرنسي، إنجليزي، إسباني، إيطالي، ألماني، تركي)

## ملاحظات تقنية

- الدرجة السريعة هي حقل اختياري (nullable)
- يتم التحقق من صحة الدرجة في الـ Backend (0-20)
- الدرجة لا تؤثر على الدرجات الرسمية في نظام التقييم
- يمكن استخدامها كمرجع سريع أو للتقييم المؤقت

## الدعم الفني

في حالة وجود أي مشاكل:
1. تأكد من تشغيل migration قاعدة البيانات
2. تحقق من أن Backend و Frontend يعملان بشكل صحيح
3. راجع console logs للأخطاء




