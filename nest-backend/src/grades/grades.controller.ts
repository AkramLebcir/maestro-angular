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
  Query,
} from '@nestjs/common';
import { GradesService } from './grades.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { GradeResponseDto } from './dto/grade-response.dto';

@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createGradeDto: CreateGradeDto): Promise<GradeResponseDto> {
    return this.gradesService.create(createGradeDto);
  }

  @Get()
  async findAll(@Query('classId') classId?: string): Promise<GradeResponseDto[]> {
    const classIdNumber = classId ? parseInt(classId, 10) : undefined;
    return this.gradesService.findAll(classIdNumber);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<GradeResponseDto> {
    return this.gradesService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGradeDto: UpdateGradeDto,
  ): Promise<GradeResponseDto> {
    return this.gradesService.update(id, updateGradeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.gradesService.remove(id);
  }
}

