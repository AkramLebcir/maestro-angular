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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';

@Controller('notebooks')
@ModuleAccess('notebooks')
export class NotebooksController {
  constructor(private readonly notebooksService: NotebooksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthUser,
    @Body() createNotebookDto: CreateNotebookDto,
  ): Promise<NotebookResponseDto> {
    return this.notebooksService.create(user.id, createNotebookDto);
  }

  @Get()
  async findAll(@CurrentUser() user: AuthUser): Promise<NotebookResponseDto[]> {
    return this.notebooksService.findAll(user.id);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<NotebookResponseDto> {
    return this.notebooksService.findOne(user.id, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNotebookDto: UpdateNotebookDto,
  ): Promise<NotebookResponseDto> {
    return this.notebooksService.update(user.id, id, updateNotebookDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.notebooksService.remove(user.id, id);
  }

  // Course Entry Routes
  @Post(':notebookId/courses')
  @HttpCode(HttpStatus.CREATED)
  async createCourseEntry(
    @CurrentUser() user: AuthUser,
    @Param('notebookId', ParseIntPipe) notebookId: number,
    @Body() createCourseEntryDto: CreateCourseEntryDto,
  ): Promise<CourseEntryResponseDto> {
    return this.notebooksService.createCourseEntry(user.id, notebookId, createCourseEntryDto);
  }

  @Get(':notebookId/courses')
  async findAllCourseEntries(
    @CurrentUser() user: AuthUser,
    @Param('notebookId', ParseIntPipe) notebookId: number,
  ): Promise<CourseEntryResponseDto[]> {
    return this.notebooksService.findAllCourseEntries(user.id, notebookId);
  }

  @Get(':notebookId/courses/:courseEntryId')
  async findOneCourseEntry(
    @CurrentUser() user: AuthUser,
    @Param('notebookId', ParseIntPipe) notebookId: number,
    @Param('courseEntryId', ParseIntPipe) courseEntryId: number,
  ): Promise<CourseEntryResponseDto> {
    return this.notebooksService.findOneCourseEntry(user.id, notebookId, courseEntryId);
  }

  @Patch(':notebookId/courses/:courseEntryId')
  async updateCourseEntry(
    @CurrentUser() user: AuthUser,
    @Param('notebookId', ParseIntPipe) notebookId: number,
    @Param('courseEntryId', ParseIntPipe) courseEntryId: number,
    @Body() updateCourseEntryDto: UpdateCourseEntryDto,
  ): Promise<CourseEntryResponseDto> {
    return this.notebooksService.updateCourseEntry(user.id, notebookId, courseEntryId, updateCourseEntryDto);
  }

  @Delete(':notebookId/courses/:courseEntryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeCourseEntry(
    @CurrentUser() user: AuthUser,
    @Param('notebookId', ParseIntPipe) notebookId: number,
    @Param('courseEntryId', ParseIntPipe) courseEntryId: number,
  ): Promise<void> {
    return this.notebooksService.removeCourseEntry(user.id, notebookId, courseEntryId);
  }
}

