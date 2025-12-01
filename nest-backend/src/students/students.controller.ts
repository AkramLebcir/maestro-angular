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
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentResponseDto } from './dto/student-response.dto';
import { BulkCreateStudentsDto } from './dto/bulk-create-students.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';

@Controller('students')
@ModuleAccess('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthUser,
    @Body() createStudentDto: CreateStudentDto,
  ): Promise<StudentResponseDto> {
    return this.studentsService.create(user.id, createStudentDto);
  }

  @Get()
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query('classId') classId?: string,
    @Query('group') group?: string,
  ): Promise<StudentResponseDto[]> {
    return this.studentsService.findAll(user.id, {
      classId: classId ? Number(classId) : undefined,
      group: group ? Number(group) : undefined,
    });
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StudentResponseDto> {
    return this.studentsService.findOne(user.id, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStudentDto: UpdateStudentDto,
  ): Promise<StudentResponseDto> {
    return this.studentsService.update(user.id, id, updateStudentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.studentsService.remove(user.id, id);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  async bulkCreate(
    @CurrentUser() user: AuthUser,
    @Body() bulkCreateDto: BulkCreateStudentsDto,
  ): Promise<{ success: StudentResponseDto[]; failed: Array<{ student: CreateStudentDto; error: string }> }> {
    return this.studentsService.bulkCreate(user.id, bulkCreateDto);
  }
}


