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
import { ComputerChecklistService } from './computer-checklist.service';
import { CreateComputerChecklistDto } from './dto/create-computer-checklist.dto';
import { UpdateComputerChecklistDto } from './dto/update-computer-checklist.dto';

@Controller('computer-checklists')
export class ComputerChecklistController {
  constructor(private readonly service: ComputerChecklistService) {}

  @Get()
  findAll(@Query('labId') labId?: string) {
    return this.service.findAll(labId ? Number(labId) : undefined);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateComputerChecklistDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateComputerChecklistDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}


