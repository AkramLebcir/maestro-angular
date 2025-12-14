# ميزة مجلس القسم - Council Feature

## نظرة عامة

تم إضافة ميزة مجلس القسم الكاملة إلى التطبيق، والتي تتضمن:
- **مجلس القسم (Semester Council)**: لإدخال بيانات التلاميذ لكل فصل
- **القرار النهائي (Final Decision)**: لحساب المعدل السنوي واتخاذ القرار النهائي

---

## المكونات الجديدة

### Backend (NestJS)

#### 1. Entities
- **`CouncilSemesterRecord`** (`nest-backend/src/council/entities/council-semester-record.entity.ts`)
  - معلومات مجلس القسم لكل تلميذ في كل فصل
  - يحتوي على: معدل الأستاذ، معدل الفصل، تقييم السلوك، الغيابات، الإجازات، ملاحظات

- **`FinalCouncilDecision`** (`nest-backend/src/council/entities/final-council-decision.entity.ts`)
  - القرار النهائي لكل تلميذ
  - يحتوي على: معدلات الفصول الثلاثة، المعدل السنوي، القرار النهائي

#### 2. DTOs
- `CreateCouncilSemesterRecordDto`
- `UpdateCouncilSemesterRecordDto`
- `CreateFinalCouncilDecisionDto`
- `UpdateFinalCouncilDecisionDto`

#### 3. Service (`council.service.ts`)
وظائف رئيسية:
- `createCouncilSemesterRecord()` - إنشاء سجل مجلس قسم
- `findAllCouncilSemesterRecords()` - جلب جميع سجلات مجلس القسم
- `updateCouncilSemesterRecord()` - تحديث سجل
- `bulkUpsertCouncilSemesterRecords()` - حفظ جماعي
- `calculateTeacherAverage()` - حساب معدل الأستاذ تلقائياً
- `createFinalCouncilDecision()` - إنشاء قرار نهائي
- `findAllFinalCouncilDecisions()` - جلب جميع القرارات
- `updateFinalCouncilDecision()` - تحديث قرار
- `bulkUpsertFinalCouncilDecisions()` - حفظ جماعي
- `syncTermAveragesFromCouncilRecords()` - مزامنة معدلات الفصول

#### 4. Controller (`council.controller.ts`)
نقاط النهاية (Endpoints):
```
GET    /council/semester-records?classId=X&term=Y
POST   /council/semester-records
PATCH  /council/semester-records/:id
DELETE /council/semester-records/:id
POST   /council/semester-records/bulk
GET    /council/semester-records/calculate-teacher-average/:studentId

GET    /council/final-decisions?classId=X
POST   /council/final-decisions
PATCH  /council/final-decisions/:id
DELETE /council/final-decisions/:id
POST   /council/final-decisions/bulk
GET    /council/final-decisions/sync-term-averages/:studentId
```

#### 5. Module (`council.module.ts`)
تم دمج Module في `app.module.ts`

#### 6. Migration
ملف: `nest-backend/src/database/migrations/1702400000000-CreateCouncilTables.ts`
- إنشاء جدول `council_semester_records`
- إنشاء جدول `final_council_decisions`

---

### Frontend (Angular)

#### 1. Interfaces
تم إضافة في `gradebook.component.ts`:
- `CouncilSemesterRecord` - واجهة بيانات مجلس القسم
- `FinalCouncilDecision` - واجهة القرار النهائي

#### 2. Component Properties
متغيرات جديدة:
```typescript
councilRecords: CouncilSemesterRecord[]
finalDecisions: FinalCouncilDecision[]
councilSelectedClass: Class | null
councilSelectedTerm: number
councilActiveTab: 'semester' | 'final'
councilStudentsWithRecords: (Student & { councilRecord?: CouncilSemesterRecord })[]
finalStudentsWithDecisions: (Student & { finalDecision?: FinalCouncilDecision })[]
```

#### 3. Methods
وظائف رئيسية:
- `onCouncilClassChange()` - عند تغيير القسم
- `onCouncilTermChange()` - عند تغيير الفصل
- `loadCouncilSemesterData()` - تحميل بيانات مجلس القسم
- `loadCouncilStudents()` - تحميل التلاميذ
- `calculateTeacherAverages()` - حساب معدلات الأستاذ
- `saveCouncilRecord()` - حفظ سجل واحد
- `bulkSaveCouncilRecords()` - حفظ جميع السجلات
- `exportCouncilSemesterPDF()` - تصدير PDF لمجلس القسم
- `loadFinalCouncilDecisions()` - تحميل القرارات النهائية
- `loadFinalStudents()` - تحميل التلاميذ للقرار النهائي
- `syncAllTermAverages()` - مزامنة معدلات الفصول
- `calculateAnnualAverage()` - حساب المعدل السنوي
- `determineAutoDecision()` - تحديد القرار تلقائياً
- `saveFinalDecision()` - حفظ قرار واحد
- `bulkSaveFinalDecisions()` - حفظ جميع القرارات
- `exportFinalDecisionPDF()` - تصدير PDF للقرار النهائي

#### 4. HTML Template
تم إضافة:
- Tab جديد "مجلس القسم" في القائمة الرئيسية
- Sub-tabs: "مجلس القسم" و "القرار النهائي"
- جدول مجلس القسم مع جميع الحقول المطلوبة
- جدول القرار النهائي
- أزرار حفظ وتصدير PDF

---

## كيفية الاستخدام

### 1. تثبيت المكتبات
```bash
cd angular-frontend
npm install
```

### 2. تشغيل Migration
```bash
cd nest-backend
# قم بتشغيل migration لإنشاء الجداول
# (يعتمد على إعدادات TypeORM في المشروع)
```

### 3. تشغيل Backend
```bash
cd nest-backend
npm run start:dev
```

### 4. تشغيل Frontend
```bash
cd angular-frontend
ng serve
```

### 5. الوصول للميزة
1. افتح التطبيق
2. اذهب إلى صفحة Gradebook
3. اضغط على tab "مجلس القسم"

---

## استخدام مجلس القسم

### Tab 1: مجلس القسم
1. اختر القسم والفصل من القوائم المنسدلة
2. سيتم تحميل جميع التلاميذ تلقائياً
3. معدل الأستاذ يُحسب تلقائياً من النقاط الموجودة
4. يمكنك إدخال:
   - معدل الفصل (0-20)
   - تقييم السلوك (1-5 نجوم)
   - عدد الغيابات
   - الإجازات (امتياز، تهنئة، تشجيع، لوحة شرف، لا شيء)
   - ملاحظات مجلس القسم
5. احفظ كل سجل بشكل فردي أو احفظ الكل
6. صدّر PDF منسق بشكل جميل

### Tab 2: القرار النهائي
1. اختر القسم
2. سيتم تحميل معدلات الفصول الثلاثة تلقائياً من سجلات مجلس القسم
3. يمكنك تعديل المعدلات يدوياً
4. المعدل السنوي يُحسب تلقائياً: (ف1 + ف2 + ف3) ÷ 3
5. القرار النهائي يُحدد تلقائياً:
   - معدل ≥ 10 → يتنقل
   - معدل < 10 → يرتب
   - 9 ≤ معدل < 10 → استدراك
6. يمكنك تفعيل "قرار يدوي" لاختيار قرار مخصص:
   - يوجّه
   - م.ت.م (موجه تقني)
7. احفظ كل قرار بشكل فردي أو احفظ الكل
8. صدّر PDF للقرارات النهائية

---

## ملاحظات مهمة

1. **معدل الأستاذ**: يُحسب تلقائياً من النقاط المدخلة في التطبيق
2. **معدل الفصل**: يُدخل يدوياً من قبل الأستاذ (قد يختلف عن معدل الأستاذ)
3. **القرار التلقائي**: يعتمد على المعدل السنوي ويمكن تعطيله باختيار "قرار يدوي"
4. **PDF Export**: يستخدم `jspdf-autotable` لإنشاء جداول منسقة
5. **Multi-tenant**: جميع البيانات مرتبطة بـ `ownerId` (المعلم/المستخدم)

---

## الميزات الإضافية

- ✅ Inline editing لجميع الحقول
- ✅ حفظ فردي أو جماعي
- ✅ تصدير PDF منسق ومهني
- ✅ حساب تلقائي للمعدلات
- ✅ تحديد تلقائي للقرارات
- ✅ واجهة responsive (متوافقة مع الهاتف والتابلت)
- ✅ Dark mode support
- ✅ دعم اللغة العربية
- ✅ دمج كامل مع نظام النقاط الموجود

---

## الدعم والمساعدة

في حال وجود أي مشاكل أو أسئلة:
1. تحقق من console للأخطاء
2. تأكد من تشغيل Backend و Frontend
3. تأكد من تشغيل Migration
4. تحقق من صلاحيات المستخدم

---

## الملفات المضافة/المعدلة

### Backend
- ✅ `nest-backend/src/council/entities/council-semester-record.entity.ts`
- ✅ `nest-backend/src/council/entities/final-council-decision.entity.ts`
- ✅ `nest-backend/src/council/dto/create-council-semester-record.dto.ts`
- ✅ `nest-backend/src/council/dto/update-council-semester-record.dto.ts`
- ✅ `nest-backend/src/council/dto/create-final-council-decision.dto.ts`
- ✅ `nest-backend/src/council/dto/update-final-council-decision.dto.ts`
- ✅ `nest-backend/src/council/council.service.ts`
- ✅ `nest-backend/src/council/council.controller.ts`
- ✅ `nest-backend/src/council/council.module.ts`
- ✅ `nest-backend/src/app.module.ts` (modified)
- ✅ `nest-backend/src/database/migrations/1702400000000-CreateCouncilTables.ts`

### Frontend
- ✅ `angular-frontend/src/app/pages/gradebook/gradebook.component.ts` (modified)
- ✅ `angular-frontend/src/app/pages/gradebook/gradebook.component.html` (modified)
- ✅ `angular-frontend/package.json` (modified - added jspdf-autotable)

---

تم إنجاز المهمة بنجاح! 🎉



