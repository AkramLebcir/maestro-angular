import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LabsService } from './labs.service';
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';
import { LabResponseDto } from './dto/lab-response.dto';

@Controller('labs')
export class LabsController {
  constructor(private readonly labsService: LabsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createLabDto: CreateLabDto): Promise<LabResponseDto> {
    return this.labsService.create(createLabDto);
  }

  @Get()
  async findAll(): Promise<LabResponseDto[]> {
    return this.labsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<LabResponseDto> {
    return this.labsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLabDto: UpdateLabDto,
  ): Promise<LabResponseDto> {
    return this.labsService.update(id, updateLabDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.labsService.remove(id);
  }
}

