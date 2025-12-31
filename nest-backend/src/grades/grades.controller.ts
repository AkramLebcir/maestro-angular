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
  Res,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Response } from 'express';
import { GradesService } from './grades.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { GradeResponseDto } from './dto/grade-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';

@Controller('grades')
@ModuleAccess('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthUser,
    @Body() createGradeDto: CreateGradeDto,
  ): Promise<GradeResponseDto> {
    return this.gradesService.create(user.id, createGradeDto);
  }

  @Get()
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query('classId') classId?: string,
  ): Promise<GradeResponseDto[]> {
    const classIdNumber = classId ? parseInt(classId, 10) : undefined;
    return this.gradesService.findAll(user.id, classIdNumber);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GradeResponseDto> {
    return this.gradesService.findOne(user.id, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGradeDto: UpdateGradeDto,
  ): Promise<GradeResponseDto> {
    return this.gradesService.update(user.id, id, updateGradeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.gradesService.remove(user.id, id);
  }

  @Post('import-excel')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        const allowedTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ];
        if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls)$/i)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('نوع الملف غير مسموح. يُسمح فقط بملفات Excel (.xlsx أو .xls)'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async importExcel(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('لم يتم استقبال أي ملف. يرجى اختيار ملف Excel.');
    }
    return this.gradesService.importFromExcel(user.id, file);
  }

  @Post('export-excel')
  async exportExcel(
    @CurrentUser() user: AuthUser,
    @Body() body: { classId: number; excelData: any[][] },
    @Res() res?: Response,
  ) {
    const buffer = await this.gradesService.exportToExcel(user.id, body.classId, body.excelData);
    const fileName = `سجل_الدرجات_${new Date().toISOString().split('T')[0]}.xlsx`;

    if (res) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      res.send(buffer);
    } else {
      return buffer;
    }
  }

  @Post('export-processed-excel')
  async exportProcessedExcel(
    @CurrentUser() user: AuthUser,
    @Body() body: {
      processedExcelData: any[];
      processedSheetsData: Array<{ sheetName: string; data: any[] }>;
      gradeErrors: any[];
      selectedLanguage?: string;
      selectedLevel?: string;
    },
    @Res() res: Response,
  ) {
    const buffer = await this.gradesService.exportProcessedExcel(user.id, body);
    const levelNames: { [key: string]: string } = {
      'primary': 'ابتدائي',
      'middle': 'متوسط',
      'secondary': 'ثانوي'
    };
    const levelName = levelNames[body.selectedLevel || ''] || 'غير محدد';
    const fileName = `النتائج_المعالجة_${levelName}_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.send(buffer);
  }

  @Post('export-processed-excel-with-original')
  @UseInterceptors(
    FileInterceptor('originalFile', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        const allowedTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ];
        if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls)$/i)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('نوع الملف غير مسموح. يُسمح فقط بملفات Excel (.xlsx أو .xls)'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async exportProcessedExcelWithOriginalStructure(
    @CurrentUser() user: AuthUser,
    @UploadedFile() originalFile: Express.Multer.File,
    @Body() body: {
      processedSheetsData: Array<{ sheetName: string; data: any[] }>;
      selectedLanguage?: string;
      originalFileName?: string;
    },
    @Res() res: Response,
  ) {
    if (!originalFile) {
      throw new BadRequestException('لم يتم استقبال الملف الأصلي');
    }

    const buffer = await this.gradesService.exportProcessedExcelWithOriginalStructure(
      user.id,
      originalFile,
      body,
    );

    let fileName = 'ملف_مملوء.xlsx';
    if (body.originalFileName) {
      const nameWithoutExt = body.originalFileName.replace(/\.(xlsx|xls)$/i, '');
      fileName = `${nameWithoutExt}_مملوء.xlsx`;
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.send(buffer);
  }
}

