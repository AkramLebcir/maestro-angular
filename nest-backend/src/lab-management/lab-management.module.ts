import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabDeviceLog } from './lab-device-log.entity';
import { LabEquipment } from './lab-equipment.entity';
import { LabSoftware } from './lab-software.entity';
import { LabFurniture } from './lab-furniture.entity';
import { LabInventoryItem } from './lab-inventory-item.entity';
import { ComputerChecklist } from './computer-checklist.entity';
import { LabCleaning } from './lab-cleaning.entity';
import { LabDeviceLogsService } from './lab-device-logs.service';
import { LabDeviceLogsController } from './lab-device-logs.controller';
import { LabEquipmentService } from './lab-equipment.service';
import { LabEquipmentController } from './lab-equipment.controller';
import { LabSoftwareService } from './lab-software.service';
import { LabSoftwareController } from './lab-software.controller';
import { LabFurnitureService } from './lab-furniture.service';
import { LabFurnitureController } from './lab-furniture.controller';
import { LabInventoryService } from './lab-inventory.service';
import { LabInventoryController } from './lab-inventory.controller';
import { ComputerChecklistService } from './computer-checklist.service';
import { ComputerChecklistController } from './computer-checklist.controller';
import { LabCleaningService } from './lab-cleaning.service';
import { LabCleaningController } from './lab-cleaning.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LabDeviceLog,
      LabEquipment,
      LabSoftware,
      LabFurniture,
      LabInventoryItem,
      ComputerChecklist,
      LabCleaning,
    ]),
  ],
  controllers: [
    LabDeviceLogsController,
    LabEquipmentController,
    LabSoftwareController,
    LabFurnitureController,
    LabInventoryController,
    ComputerChecklistController,
    LabCleaningController,
  ],
  providers: [
    LabDeviceLogsService,
    LabEquipmentService,
    LabSoftwareService,
    LabFurnitureService,
    LabInventoryService,
    ComputerChecklistService,
    LabCleaningService,
  ],
})
export class LabManagementModule {}



