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
import { LabFurnitureService } from './lab-furniture.service';
import { CreateLabFurnitureDto } from './dto/create-lab-furniture.dto';
import { UpdateLabFurnitureDto } from './dto/update-lab-furniture.dto';

@Controller('lab-furniture')
export class LabFurnitureController {
  constructor(private readonly service: LabFurnitureService) {}

  @Get()
  findAll(@Query('labId') labId?: string) {
    return this.service.findAll(labId ? Number(labId) : undefined);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateLabFurnitureDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLabFurnitureDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}


