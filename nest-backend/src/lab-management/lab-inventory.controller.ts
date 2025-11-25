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

@Controller('lab-inventory')
export class LabInventoryController {
  constructor(private readonly service: LabInventoryService) {}

  @Get()
  findAll(@Query('labId') labId?: string) {
    return this.service.findAll(labId ? Number(labId) : undefined);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateLabInventoryItemDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLabInventoryItemDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}


