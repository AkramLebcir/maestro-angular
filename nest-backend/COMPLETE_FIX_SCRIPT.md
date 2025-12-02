# Script شامل لإصلاح جميع الخدمات

## المشكلة
جميع الخدمات تحاول إنشاء/تحديث سجلات بدون `ownerId`، مما يسبب Internal Server Error.

## الحل
يجب تحديث جميع الخدمات التي تستخدم `TenantOwnedEntity` لإضافة `ownerId` من المستخدم الحالي.

## الخدمات التي تحتاج إصلاح:

### 1. TopicsService
### 2. NotebooksService
### 3. AttendanceService
### 4. BehaviorEventsService
### 5. ProgressTrackingService
### 6. PedagogicalDocsService
### 7. AnnualPlanningService (holiday-period, annual-distribution)
### 8. WorkstationsService (workstations, seat-assignments)
### 9. LabManagementService (جميع الخدمات الفرعية)

## النمط الموحد للتحديث:

### Service Pattern:
```typescript
// create()
async create(ownerId: number, dto: CreateDto): Promise<ResponseDto> {
  const entity = this.repository.create({ ...dto, ownerId });
  return this.repository.save(entity);
}

// findAll()
async findAll(ownerId: number): Promise<ResponseDto[]> {
  return this.repository.find({ where: { ownerId } });
}

// findOne()
async findOne(ownerId: number, id: number): Promise<ResponseDto> {
  return this.repository.findOne({ where: { id, ownerId } });
}

// update()
async update(ownerId: number, id: number, dto: UpdateDto): Promise<ResponseDto> {
  const entity = await this.repository.findOne({ where: { id, ownerId } });
  // ... validation and update
}

// remove()
async remove(ownerId: number, id: number): Promise<void> {
  const entity = await this.repository.findOne({ where: { id, ownerId } });
  await this.repository.remove(entity);
}
```

### Controller Pattern:
```typescript
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';

@Controller('module-name')
@ModuleAccess('module-name')
export class ModuleController {
  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateDto
  ) {
    return this.service.create(user.id, dto);
  }
  
  @Get()
  async findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user.id);
  }
  
  // ... نفس النمط لباقي الدوال
}
```

## ملاحظات مهمة:
1. عند التحقق من Relations (مثل Class, Lab, Student)، يجب التحقق من ownerId أيضاً
2. عند البحث عن existing records للتحقق من التكرار، يجب إضافة ownerId في where clause
3. جميع الاستعلامات يجب أن تعزل البيانات بـ ownerId




