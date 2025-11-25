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
import { LabSoftwareService } from './lab-software.service';
import { CreateLabSoftwareDto } from './dto/create-lab-software.dto';
import { UpdateLabSoftwareDto } from './dto/update-lab-software.dto';

@Controller('lab-software')
export class LabSoftwareController {
  constructor(private readonly service: LabSoftwareService) {}

  @Get()
  findAll(@Query('labId') labId?: string) {
    return this.service.findAll(labId ? Number(labId) : undefined);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateLabSoftwareDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLabSoftwareDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}


