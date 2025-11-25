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

@Controller('lab-device-logs')
export class LabDeviceLogsController {
  constructor(private readonly service: LabDeviceLogsService) {}

  @Get()
  findAll(@Query('labId') labId?: string) {
    return this.service.findAll(labId ? Number(labId) : undefined);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateLabDeviceLogDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLabDeviceLogDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}


