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
import { LabDeviceLogsService } from './lab-device-logs.service';
import { CreateLabDeviceLogDto } from './dto/create-lab-device-log.dto';
import { UpdateLabDeviceLogDto } from './dto/update-lab-device-log.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';

@Controller('lab-device-logs')
@ModuleAccess('lab-management')
export class LabDeviceLogsController {
  constructor(private readonly service: LabDeviceLogsService) {}

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
    @Body() dto: CreateLabDeviceLogDto,
  ) {
    return this.service.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLabDeviceLogDto,
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


