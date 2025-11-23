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
import { NotebooksService } from './notebooks.service';
import { CreateNotebookDto } from './dto/create-notebook.dto';
import { UpdateNotebookDto } from './dto/update-notebook.dto';
import { NotebookResponseDto } from './dto/notebook-response.dto';
import { CreateCourseEntryDto } from './dto/create-course-entry.dto';
import { UpdateCourseEntryDto } from './dto/update-course-entry.dto';
import { CourseEntryResponseDto } from './dto/course-entry-response.dto';

@Controller('notebooks')
export class NotebooksController {
  constructor(private readonly notebooksService: NotebooksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createNotebookDto: CreateNotebookDto): Promise<NotebookResponseDto> {
    return this.notebooksService.create(createNotebookDto);
  }

  @Get()
  async findAll(): Promise<NotebookResponseDto[]> {
    return this.notebooksService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<NotebookResponseDto> {
    return this.notebooksService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNotebookDto: UpdateNotebookDto,
  ): Promise<NotebookResponseDto> {
    return this.notebooksService.update(id, updateNotebookDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.notebooksService.remove(id);
  }

  // Course Entry Routes
  @Post(':notebookId/courses')
  @HttpCode(HttpStatus.CREATED)
  async createCourseEntry(
    @Param('notebookId', ParseIntPipe) notebookId: number,
    @Body() createCourseEntryDto: CreateCourseEntryDto,
  ): Promise<CourseEntryResponseDto> {
    return this.notebooksService.createCourseEntry(notebookId, createCourseEntryDto);
  }

  @Get(':notebookId/courses')
  async findAllCourseEntries(
    @Param('notebookId', ParseIntPipe) notebookId: number,
  ): Promise<CourseEntryResponseDto[]> {
    return this.notebooksService.findAllCourseEntries(notebookId);
  }

  @Get(':notebookId/courses/:courseEntryId')
  async findOneCourseEntry(
    @Param('notebookId', ParseIntPipe) notebookId: number,
    @Param('courseEntryId', ParseIntPipe) courseEntryId: number,
  ): Promise<CourseEntryResponseDto> {
    return this.notebooksService.findOneCourseEntry(notebookId, courseEntryId);
  }

  @Patch(':notebookId/courses/:courseEntryId')
  async updateCourseEntry(
    @Param('notebookId', ParseIntPipe) notebookId: number,
    @Param('courseEntryId', ParseIntPipe) courseEntryId: number,
    @Body() updateCourseEntryDto: UpdateCourseEntryDto,
  ): Promise<CourseEntryResponseDto> {
    return this.notebooksService.updateCourseEntry(notebookId, courseEntryId, updateCourseEntryDto);
  }

  @Delete(':notebookId/courses/:courseEntryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeCourseEntry(
    @Param('notebookId', ParseIntPipe) notebookId: number,
    @Param('courseEntryId', ParseIntPipe) courseEntryId: number,
  ): Promise<void> {
    return this.notebooksService.removeCourseEntry(notebookId, courseEntryId);
  }
}

