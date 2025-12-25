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
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { LabsService } from './labs.service';
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';
import { LabResponseDto } from './dto/lab-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';

const storage = diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = join(__dirname, '..', '..', 'uploads', 'labs');
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
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
]);

@Controller('labs')
@ModuleAccess('labs')
export class LabsController {
  constructor(private readonly labsService: LabsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthUser,
    @Body() createLabDto: CreateLabDto,
  ): Promise<LabResponseDto> {
    return this.labsService.create(user.id, createLabDto);
  }

  @Get()
  async findAll(@CurrentUser() user: AuthUser): Promise<LabResponseDto[]> {
    return this.labsService.findAll(user.id);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LabResponseDto> {
    return this.labsService.findOne(user.id, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLabDto: UpdateLabDto,
  ): Promise<LabResponseDto> {
    return this.labsService.update(user.id, id, updateLabDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.labsService.remove(user.id, id);
  }

  @Post(':id/upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      fileFilter: (_req, file, cb) => {
        if (allowedMimeTypes.has(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('نوع الملف غير مسموح. يُسمح فقط بصور PNG, JPEG, JPG, GIF, WEBP.'), false);
        }
      },
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
      },
    }),
  )
  async uploadImage(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: any,
  ): Promise<LabResponseDto> {
    if (!file) {
      throw new BadRequestException('لم يتم استقبال أي ملف. يرجى اختيار صورة بحجم أقل من 100MB.');
    }
    const fileUrl = `/uploads/labs/${file.filename}`;
    return this.labsService.addImage(user.id, id, fileUrl);
  }

  @Delete(':id/images/:imageIndex')
  @HttpCode(HttpStatus.OK)
  async removeImage(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('imageIndex', ParseIntPipe) imageIndex: number,
  ): Promise<LabResponseDto> {
    return this.labsService.removeImage(user.id, id, imageIndex);
  }
}


