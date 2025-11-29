# دليل إصلاح ownerId في جميع الخدمات

## المشكلة
جميع الخدمات تحاول إنشاء سجلات جديدة بدون `ownerId`، مما يسبب أخطاء Internal Server Error.

## الحل
يجب تحديث جميع الخدمات لإضافة `ownerId` من المستخدم الحالي عند الإنشاء والتحديث.

## الخدمات التي تحتاج إصلاح:

### ✅ تم إصلاحها:
- StudentsService
- GradesService
- ClassesService (كان يعمل بالفعل)

### ⚠️ تحتاج إصلاح:
- TimetableService
- TopicsService
- NotebooksService
- AttendanceService
- BehaviorEventsService
- ProgressTrackingService
- PedagogicalDocsService
- AnnualPlanningService
- LabManagementService (جميع الخدمات الفرعية)
- WorkstationsService
- وكل خدمة أخرى تستخدم TenantOwnedEntity

## النمط المطلوب للتحديث:

### 1. في Service:
```typescript
// قبل
async create(dto: CreateDto): Promise<ResponseDto> {
  const entity = this.repository.create(dto);
  return this.repository.save(entity);
}

// بعد
async create(ownerId: number, dto: CreateDto): Promise<ResponseDto> {
  const entity = this.repository.create({
    ...dto,
    ownerId,
  });
  return this.repository.save(entity);
}
```

### 2. في Controller:
```typescript
// قبل
@Post()
async create(@Body() dto: CreateDto) {
  return this.service.create(dto);
}

// بعد
@Post()
async create(
  @CurrentUser() user: AuthUser,
  @Body() dto: CreateDto
) {
  return this.service.create(user.id, dto);
}
```

### 3. في findAll:
```typescript
// قبل
async findAll(): Promise<ResponseDto[]> {
  return this.repository.find();
}

// بعد
async findAll(ownerId: number): Promise<ResponseDto[]> {
  return this.repository.find({ where: { ownerId } });
}
```

### 4. في findOne:
```typescript
// قبل
async findOne(id: number): Promise<ResponseDto> {
  return this.repository.findOne({ where: { id } });
}

// بعد
async findOne(ownerId: number, id: number): Promise<ResponseDto> {
  return this.repository.findOne({ where: { id, ownerId } });
}
```

## التحقق من أن Entity تستخدم TenantOwnedEntity:
```typescript
import { TenantOwnedEntity } from '../common/entities/tenant-owned.entity';

@Entity('table_name')
export class MyEntity extends TenantOwnedEntity {
  // ...
}
```

إذا كانت Entity لا تمتد TenantOwnedEntity، يجب إضافة:
- `ownerId: number` column
- `owner: User` relation

