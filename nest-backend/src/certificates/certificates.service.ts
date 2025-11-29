import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CertificateTemplate } from './certificate-template.entity';
import { Certificate } from './certificate.entity';
import { Student } from '../students/student.entity';
import { IssueCertificateDto } from './dto/issue-certificate.dto';
import { CertificateTemplateResponseDto } from './dto/certificate-template-response.dto';
import { CertificateResponseDto } from './dto/certificate-response.dto';

const DEFAULT_TEMPLATES = [
  {
    name: 'تقدير تفوق دراسي',
    description: 'شهادة تبرز التميز الأكاديمي والتفوق في الحصص والمناهج الرقمية.',
    defaultMainText:
      'بكل فخر، نمنح هذه الشهادة لـ{{student}} اعترافاً بجهوده المتميزة في مادة المعلوماتية.',
    defaultReason: 'للإنجاز المتميز في المسارات الرقمية وبرامج التفكير المنطقي.',
    defaultAcademicYear: '2024-2025',
    defaultSignatureLabel: 'توقيع الأستاذ',
  },
  {
    name: 'تقدير حسن سلوك',
    description: 'شهادة للسلوك النموذجي والمساهمة الإيجابية في بيئة الصف.',
    defaultMainText:
      'نمنح هذه الشهادة لـ{{student}} امتناناً لسلوكه الراقي واحترافيته داخل الفصول.',
    defaultReason: 'للمساهمة الملحوظة في تعزيز القيم والاحترام المتبادل.',
    defaultAcademicYear: '2024-2025',
    defaultSignatureLabel: 'توقيع الأستاذ المشرف',
  },
  {
    name: 'تقدير مشاركة فعالة',
    description: 'تسلط الضوء على التفاعل والنجاح في المشاريع الجماعية والتقنيات الحديثة.',
    defaultMainText:
      'نقر بجهود {{student}} البارزة في النقاشات والمشاريع التطبيقية لهذا الفصل.',
    defaultReason: 'للمشاركة البنّاءة والمبادرات الرقمية خلال العام الدراسي.',
    defaultAcademicYear: '2024-2025',
    defaultSignatureLabel: 'توقيع المدرب التقني',
  },
];

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(CertificateTemplate)
    private readonly templateRepository: Repository<CertificateTemplate>,
    @InjectRepository(Certificate)
    private readonly certificateRepository: Repository<Certificate>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async getTemplates(ownerId: number): Promise<CertificateTemplateResponseDto[]> {
    await this.ensureDefaultTemplates(ownerId);
    const templates = await this.templateRepository.find({
      where: { ownerId },
      order: { id: 'ASC' },
    });
    return templates.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      defaultMainText: template.defaultMainText,
      defaultReason: template.defaultReason,
      defaultAcademicYear: template.defaultAcademicYear,
      defaultSignatureLabel: template.defaultSignatureLabel,
    }));
  }

  async findAll(
    ownerId: number,
    query?: { studentId?: number; classId?: number },
  ): Promise<CertificateResponseDto[]> {
    const where: any = { ownerId };

    if (query?.studentId) {
      where.studentId = query.studentId;
    }

    // Since Certificate doesn't directly have classId, we might need to filter by student's class
    // However, for simplicity and performance, we can just return all or filter by student.
    // If class filtering is strict, we'd need to join student relation and filter there.
    // Let's start with basic student filtering or all.
    
    const certificates = await this.certificateRepository.find({
      where,
      relations: ['student', 'student.class', 'template'],
      order: { createdAt: 'DESC' },
    });

    // Filter by class in memory if needed (or use QueryBuilder for better perf)
    let filteredCertificates = certificates;
    if (query?.classId) {
      filteredCertificates = certificates.filter(
        (c) => c.student?.class?.id === query.classId,
      );
    }

    return filteredCertificates.map((cert) => ({
      id: cert.id,
      student: {
        id: cert.student.id,
        firstName: cert.student.firstName,
        lastName: cert.student.lastName,
      },
      className: cert.student.class?.name,
      template: cert.template
        ? {
            id: cert.template.id,
            name: cert.template.name,
          }
        : undefined,
      mainText: cert.mainText,
      reason: cert.reason,
      issueDate: cert.issueDate,
      academicYear: cert.academicYear,
      signatureName: cert.signatureName,
      createdAt: cert.createdAt,
    }));
  }

  async issueCertificate(
    ownerId: number,
    dto: IssueCertificateDto,
  ): Promise<CertificateResponseDto> {
    const student = await this.studentRepository.findOne({
      where: { id: dto.studentId, ownerId },
      relations: ['class'],
    });

    if (!student) {
      throw new NotFoundException('الطالب المحدد غير موجود');
    }

    const template = await this.templateRepository.findOne({
      where: { id: dto.templateId, ownerId },
    });

    if (!template) {
      throw new NotFoundException('القالب المحدد غير موجود');
    }

    const certificate = this.certificateRepository.create({
      ownerId,
      studentId: student.id,
      templateId: template.id,
      mainText: dto.mainText,
      reason: dto.reason,
      issueDate: new Date(dto.issueDate),
      academicYear: dto.academicYear,
      signatureName: dto.signatureName,
    });

    const saved = await this.certificateRepository.save(certificate);
    return {
      id: saved.id,
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
      },
      className: student.class?.name,
      template: {
        id: template.id,
        name: template.name,
      },
      mainText: saved.mainText,
      reason: saved.reason,
      issueDate: saved.issueDate,
      academicYear: saved.academicYear,
      signatureName: saved.signatureName,
      createdAt: saved.createdAt,
    };
  }

  private async ensureDefaultTemplates(ownerId: number) {
    const count = await this.templateRepository.count({ where: { ownerId } });
    if (count > 0) {
      return;
    }
    const templates = DEFAULT_TEMPLATES.map((template) =>
      this.templateRepository.create({
        ...template,
        ownerId,
      }),
    );
    await this.templateRepository.save(templates);
  }
}

