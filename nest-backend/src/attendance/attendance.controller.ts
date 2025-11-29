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
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { AttendanceResponseDto } from './dto/attendance-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';

@Controller('attendance')
@ModuleAccess('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthUser,
    @Body() createAttendanceDto: CreateAttendanceDto,
  ): Promise<AttendanceResponseDto> {
    return this.attendanceService.create(user.id, createAttendanceDto);
  }

  @Get()
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query('studentId') studentId?: string,
    @Query('classId') classId?: string,
    @Query('date') date?: string,
  ): Promise<AttendanceResponseDto[]> {
    const query: { studentId?: number; classId?: number; date?: string } = {};

    if (studentId) {
      query.studentId = parseInt(studentId, 10);
    }

    if (classId) {
      query.classId = parseInt(classId, 10);
    }

    if (date) {
      query.date = date;
    }

    return this.attendanceService.findAll(user.id, Object.keys(query).length > 0 ? query : undefined);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AttendanceResponseDto> {
    return this.attendanceService.findOne(user.id, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
  ): Promise<AttendanceResponseDto> {
    return this.attendanceService.update(user.id, id, updateAttendanceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.attendanceService.remove(user.id, id);
  }
}


