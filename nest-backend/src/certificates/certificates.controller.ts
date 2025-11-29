import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';
import { CertificateTemplateResponseDto } from './dto/certificate-template-response.dto';
import { IssueCertificateDto } from './dto/issue-certificate.dto';
import { CertificateResponseDto } from './dto/certificate-response.dto';

@Controller('certificates')
@ModuleAccess('certificate-generator')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get('templates')
  async getTemplates(
    @CurrentUser() user: AuthUser,
  ): Promise<CertificateTemplateResponseDto[]> {
    return this.certificatesService.getTemplates(user.id);
  }

  @Get()
  async findAll(
    @CurrentUser() user: AuthUser,
    @Body('studentId') studentId?: number,
    @Body('classId') classId?: number,
  ): Promise<CertificateResponseDto[]> {
    return this.certificatesService.findAll(user.id, { studentId, classId });
  }

  @Post()
  async issueCertificate(
    @CurrentUser() user: AuthUser,
    @Body() payload: IssueCertificateDto,
  ): Promise<CertificateResponseDto> {
    return this.certificatesService.issueCertificate(user.id, payload);
  }
}

