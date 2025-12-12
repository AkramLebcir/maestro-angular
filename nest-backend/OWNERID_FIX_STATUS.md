# حالة إصلاح ownerId في جميع الخدمات

## ✅ تم إصلاحها:
1. **StudentsService** - تم إضافة ownerId لجميع الدوال
2. **GradesService** - تم إضافة ownerId لجميع الدوال
3. **TimetableService** - تم إضافة ownerId لجميع الدوال
4. **ClassesService** - كان يعمل بالفعل
5. **LabsService** - كان يعمل بالفعل

## ⚠️ تحتاج إصلاح عاجل (تسبب Internal Server Error):

### الخدمات الأساسية:
1. **TopicsService** - ❌ لا يمرر ownerId عند create
2. **NotebooksService** - ❌ لا يمرر ownerId عند create
3. **AttendanceService** - ❌ لا يمرر ownerId عند create
4. **BehaviorEventsService** - ❌ لا يمرر ownerId عند create

### الخدمات الإضافية:
5. **ProgressTrackingService**
6. **PedagogicalDocsService**
7. **AnnualPlanningService** (holiday-period, annual-distribution)
8. **WorkstationsService** (workstations, seat-assignments)
9. **LabManagementService** (جميع الخدمات الفرعية)

## 📝 النمط المطلوب:

### Service:
```typescript
async create(ownerId: number, dto: CreateDto) {
  const entity = this.repository.create({ ...dto, ownerId });
  return this.repository.save(entity);
}
```

### Controller:
```typescript
@Post()
async create(@CurrentUser() user: AuthUser, @Body() dto: CreateDto) {
  return this.service.create(user.id, dto);
}
```

## 🚀 الخطوات التالية:
1. إصلاح TopicsService
2. إصلاح NotebooksService
3. إصلاح AttendanceService
4. إصلاح BehaviorEventsService
5. إصلاح باقي الخدمات







