# إصلاح باقي الخدمات - دليل سريع

## ✅ تم إصلاحها:
1. StudentsService + StudentsController
2. GradesService + GradesController
3. TimetableService + TimetableController
4. TopicsService + TopicsController
5. ClassesService + ClassesController (كان يعمل)
6. LabsService + LabsController (كان يعمل)

## ⚠️ تحتاج إصلاح (نفس النمط):

### 1. NotebooksService + NotebooksController
```typescript
// في Service:
async create(ownerId: number, dto: CreateNotebookDto) {
  const entity = this.repository.create({ ...dto, ownerId });
  return this.repository.save(entity);
}

// في Controller:
@Post()
async create(@CurrentUser() user: AuthUser, @Body() dto: CreateNotebookDto) {
  return this.service.create(user.id, dto);
}
```

### 2. AttendanceService + AttendanceController
نفس النمط - إضافة ownerId لجميع الدوال.

### 3. BehaviorEventsService + BehaviorEventsController
نفس النمط - إضافة ownerId لجميع الدوال.

### 4. ProgressTrackingService
نفس النمط - إضافة ownerId لجميع الدوال.

### 5. PedagogicalDocsService
نفس النمط - إضافة ownerId لجميع الدوال.

### 6. AnnualPlanningService (holiday-period, annual-distribution)
نفس النمط - إضافة ownerId لجميع الدوال.

### 7. WorkstationsService (workstations, seat-assignments)
نفس النمط - إضافة ownerId لجميع الدوال.

### 8. LabManagementService (جميع الخدمات الفرعية)
- LabInventoryService
- LabEquipmentService
- LabSoftwareService
- LabFurnitureService
- LabCleaningLogsService
- ComputerChecklistsService
- LabDeviceLogsService

## 📝 النمط الموحد:

### Service Methods:
```typescript
async create(ownerId: number, dto: CreateDto): Promise<ResponseDto> {
  const entity = this.repository.create({ ...dto, ownerId });
  return this.repository.save(entity);
}

async findAll(ownerId: number): Promise<ResponseDto[]> {
  return this.repository.find({ where: { ownerId } });
}

async findOne(ownerId: number, id: number): Promise<ResponseDto> {
  return this.repository.findOne({ where: { id, ownerId } });
}

async update(ownerId: number, id: number, dto: UpdateDto): Promise<ResponseDto> {
  const entity = await this.repository.findOne({ where: { id, ownerId } });
  // ... validation and update
  return this.repository.save(entity);
}

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
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateDto) {
    return this.service.create(user.id, dto);
  }
  
  @Get()
  async findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user.id);
  }
  
  @Get(':id')
  async findOne(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(user.id, id);
  }
  
  @Patch(':id')
  async update(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDto) {
    return this.service.update(user.id, id, dto);
  }
  
  @Delete(':id')
  async remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(user.id, id);
  }
}
```

## ⚠️ ملاحظات مهمة:
1. عند التحقق من Relations (مثل Class, Lab, Student)، تحقق من ownerId أيضاً
2. عند البحث عن existing records للتحقق من التكرار، أضف ownerId في where clause
3. جميع الاستعلامات يجب أن تعزل البيانات بـ ownerId
4. تأكد من إضافة `@ModuleAccess('module-name')` للتحكم في الوصول



