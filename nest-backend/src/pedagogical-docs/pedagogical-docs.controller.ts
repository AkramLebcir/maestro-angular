import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { PedagogicalDocsService } from './pedagogical-docs.service';
import { CreatePedagogicalDocumentDto } from './dto/create-pedagogical-document.dto';
import { PedagogicalDocumentFilterDto } from './dto/pedagogical-document-filter.dto';
import { PedagogicalDocument } from './pedagogical-document.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';

const storage = diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = join(__dirname, '..', '..', 'uploads', 'pedagogical-docs');
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
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

@Controller('pedagogical-docs')
@ModuleAccess('pedagogical-docs')
export class PedagogicalDocsController {
  constructor(private readonly service: PedagogicalDocsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      fileFilter: (_req, file, cb) => {
        if (allowedMimeTypes.has(file.mimetype)) {
          cb(null, true);
        } else {
          cb(null, false);
        }
      },
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
  )
  async uploadDocument(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: any,
    @Body() dto: CreatePedagogicalDocumentDto,
  ): Promise<PedagogicalDocument> {
    if (!file) {
      throw new BadRequestException(
        'لم يتم استقبال أي ملف. تأكد من اختيار ملف من الأنواع المسموح بها (PDF / صورة / Word) وأن حجمه أقل من 50MB.',
      );
    }
    const fileUrl = `/uploads/pedagogical-docs/${file.filename}`;
    return this.service.create(user.id, {
      ...dto,
      fileUrl,
      originalFileName: file.originalname,
    });
  }

  @Get()
  async listDocuments(
    @CurrentUser() user: AuthUser,
    @Query() filters: PedagogicalDocumentFilterDto,
  ): Promise<PedagogicalDocument[]> {
    return this.service.findAll(user.id, filters);
  }
}


