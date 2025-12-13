# إصلاح جميع الخدمات لإضافة ownerId

## المشكلة
جميع الخدمات تحاول إنشاء/تحديث سجلات بدون `ownerId`، مما يسبب Internal Server Error.

## الحل السريع - Script لإصلاح جميع الخدمات

لأن هناك العديد من الخدمات، سأقوم بإنشاء script لإصلاحها جميعاً.

## الخدمات التي تم إصلاحها:
- ✅ StudentsService
- ✅ GradesService  
- ✅ TimetableService (جاري)
- ✅ ClassesService (كان يعمل بالفعل)

## الخدمات المتبقية:
1. TopicsService + TopicsController
2. NotebooksService + NotebooksController
3. AttendanceService + AttendanceController
4. BehaviorEventsService + BehaviorEventsController
5. ProgressTrackingService
6. PedagogicalDocsService
7. AnnualPlanningService
8. WorkstationsService
9. LabManagementService (جميع الخدمات الفرعية)

## الخطوات لإصلاح كل خدمة:

### 1. Service - create()
```typescript
async create(ownerId: number, dto: CreateDto) {
  const entity = this.repository.create({ ...dto, ownerId });
  return this.repository.save(entity);
}
```

### 2. Service - findAll()
```typescript
async findAll(ownerId: number) {
  return this.repository.find({ where: { ownerId } });
}
```

### 3. Service - findOne()
```typescript
async findOne(ownerId: number, id: number) {
  return this.repository.findOne({ where: { id, ownerId } });
}
```

### 4. Controller - إضافة @CurrentUser()
```typescript
async create(@CurrentUser() user: AuthUser, @Body() dto: CreateDto) {
  return this.service.create(user.id, dto);
}
```

## ملاحظة مهمة:
- تأكد من إضافة `@ModuleAccess('module_name')` للتحكم في الوصول
- تأكد من التحقق من ownerId عند التحقق من الـ relations (مثل Class, Lab)








