import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { LabInventoryService } from './lab-inventory.service';
import { CreateLabInventoryItemDto } from './dto/create-lab-inventory-item.dto';
import { UpdateLabInventoryItemDto } from './dto/update-lab-inventory-item.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';

@Controller('lab-inventory')
@ModuleAccess('lab-management')
export class LabInventoryController {
  constructor(private readonly service: LabInventoryService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('labId') labId?: string,
  ) {
    return this.service.findAll(user.id, labId ? Number(labId) : undefined);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.findOne(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateLabInventoryItemDto,
  ) {
    return this.service.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLabInventoryItemDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.remove(user.id, id);
  }
}


