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
import { TimetableService } from './timetable.service';
import { CreateTimetableDto } from './dto/create-timetable.dto';
import { UpdateTimetableDto } from './dto/update-timetable.dto';
import { TimetableResponseDto } from './dto/timetable-response.dto';

@Controller('timetable')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTimetableDto: CreateTimetableDto): Promise<TimetableResponseDto> {
    return this.timetableService.create(createTimetableDto);
  }

  @Get()
  async findAll(): Promise<TimetableResponseDto[]> {
    return this.timetableService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<TimetableResponseDto> {
    return this.timetableService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTimetableDto: UpdateTimetableDto,
  ): Promise<TimetableResponseDto> {
    return this.timetableService.update(id, updateTimetableDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.timetableService.remove(id);
  }
}

