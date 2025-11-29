import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Certificate } from './certificate.entity';
import { CertificateTemplate } from './certificate-template.entity';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { Student } from '../students/student.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CertificateTemplate, Certificate, Student]),
  ],
  providers: [CertificatesService],
  controllers: [CertificatesController],
})
export class CertificatesModule {}

