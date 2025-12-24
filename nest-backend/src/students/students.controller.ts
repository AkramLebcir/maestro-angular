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
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentResponseDto } from './dto/student-response.dto';
import { BulkCreateStudentsDto } from './dto/bulk-create-students.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';

const storage = diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = join(__dirname, '..', '..', 'uploads', 'medical-certificates');
    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, '_');
    const fileExt = extname(safeName);
    const base = safeName.replace(fileExt, '');
    cb(null, `${timestamp}-${base}${fileExt}`);
  },
});

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
]);

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

  @Post('upload-medical-certificate')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      fileFilter: (_req, file, cb) => {
        if (allowedMimeTypes.has(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('File type not allowed. Only PDF and images are allowed.'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadMedicalCertificate(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: any,
  ): Promise<{ fileUrl: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded. Please select a file (PDF or image) under 10MB.');
    }
    const fileUrl = `/uploads/medical-certificates/${file.filename}`;
    return { fileUrl };
  }
}


