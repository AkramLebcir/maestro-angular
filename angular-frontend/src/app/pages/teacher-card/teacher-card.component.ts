import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';

interface TeacherCardForm {
  // معلومات أعلى الصفحة
  ministryHeader: string;
  directorate: string;
  wilayaDirectorate: string;
  schoolName: string;
  academicYear: string;

  lastName: string;
  firstName: string;
  birthDate: string;
  birthPlace: string;
  familyStatus: string;
  childrenCount: number | null;
  studyingChildrenCount: number | null;
  studyingChildrenInSchoolCount: number | null;
  point: string;
  className: string;
  promotionFrequency: string;
  workInstitution: string;
  firstAppointmentDate: string;
  tenureDate: string;
  lastInspectionDate: string;
  rank: string;
  grade: string;
  qualification: string;
  graduationYear: number | null;
  teachingSubject: string;
  socialSecurityNumber: string;
  postalAccountNumber: string;
  mutualNumber: string;
  idOrLicenseNumber: string;
  personalPhone: string;
  bloodType: string;

  // معلومات الحالة المهنية والشهادات
  frame: string; // الإطار
  status: string; // الصفة
  specialty: string; // الاختصاص
  currentSchoolAppointmentDate: string; // تاريخ التعيين بالمؤسسة الحالية
  currentSchoolInstallationDate: string; // تاريخ التنصيب بها
  currentGradeLevel: string; // الدرجة الحالية (نص حر)
  currentGradeEffectiveDate: string; // تاريخ سريان مفعولها
  lastInspectionScore: string; // نقطة آخر تفتيش
  degree1: string;
  degree1Institution: string;
  degree1Year: string;
  degree2: string;
  degree2Institution: string;
  degree2Year: string;
  degree3: string;
  degree3Institution: string;
  degree3Year: string;

  effectiveFrom: string;
  effectiveTo: string;
  address: string;
  wilaya: string;
  phoneNumber: string;
  email: string;

  // صورة الأستاذ (data URL)
  photoDataUrl: string | null;
}

@Component({
  selector: 'app-teacher-card',
  templateUrl: './teacher-card.component.html',
  styleUrls: ['./teacher-card.component.css']
})
export class TeacherCardComponent implements OnInit {
  private baseStorageKey = 'teacherCard';
  teacherCard: TeacherCardForm = {
    ministryHeader: 'الجمهورية الجزائرية الديمقراطية الشعبية',
    directorate: '',
    wilayaDirectorate: '',
    schoolName: '',
    academicYear: '',

    lastName: '',
    firstName: '',
    birthDate: '',
    birthPlace: '',
    familyStatus: '',
    childrenCount: null,
    studyingChildrenCount: null,
    studyingChildrenInSchoolCount: null,
    point: '',
    className: '',
    promotionFrequency: '',
    workInstitution: '',
    firstAppointmentDate: '',
    tenureDate: '',
    lastInspectionDate: '',
    rank: '',
    grade: '',
    qualification: '',
    graduationYear: null,
    teachingSubject: '',
    socialSecurityNumber: '',
    postalAccountNumber: '',
    mutualNumber: '',
    idOrLicenseNumber: '',
    personalPhone: '',
    bloodType: '',

    frame: '',
    status: '',
    specialty: '',
    currentSchoolAppointmentDate: '',
    currentSchoolInstallationDate: '',
    currentGradeLevel: '',
    currentGradeEffectiveDate: '',
    lastInspectionScore: '',
    degree1: '',
    degree1Institution: '',
    degree1Year: '',
    degree2: '',
    degree2Institution: '',
    degree2Year: '',
    degree3: '',
    degree3Institution: '',
    degree3Year: '',

    effectiveFrom: '',
    effectiveTo: '',
    address: '',
    wilaya: '',
    phoneNumber: '',
    email: '',

    photoDataUrl: null
  };

  isSaved = false;
  @ViewChild('printCard') printCardRef!: ElementRef<HTMLDivElement>;

  constructor(
    private authService: AuthService,
    public languageService: LanguageService
  ) {}

  translate(key: string, params?: { [key: string]: string }): string {
    return this.languageService.translate(key, params);
  }

  ngOnInit(): void {
    this.loadCard();
  }

  private getStorageKey(): string {
    const user = this.authService.getCurrentUser();
    return user ? `${this.baseStorageKey}_${user.id}` : this.baseStorageKey;
  }

  private loadCard(): void {
    const stored = localStorage.getItem(this.getStorageKey());
    if (stored) {
      try {
        this.teacherCard = { ...this.teacherCard, ...JSON.parse(stored) };
      } catch (error) {
        console.error('Error parsing teacher card data', error);
      }
    }
  }

  saveCard(): void {
    // حالياً نخزن البيانات محلياً فقط (يمكن ربطها بالـ backend لاحقاً)
    localStorage.setItem(this.getStorageKey(), JSON.stringify(this.teacherCard));
    this.isSaved = true;
    setTimeout(() => (this.isSaved = false), 3000);
  }

  async downloadPdf(): Promise<void> {
    const element = this.printCardRef?.nativeElement;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      // نستخدم وضعية عمودية (portrait) حتى تكون مثل النموذج الرسمي في الصورة
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // نضبط الحجم بحيث تتناسب الصورة كلها داخل صفحة A4 مع هامش خارجي صغير جداً
      // الهدف: أن يقترب إطار البطاقة قدر الإمكان من حدود الورقة بدون قص للمحتوى
      const margin = 2; // حوالي 2mm فقط حول الصفحة
      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;

      const widthRatio = availableWidth / canvas.width;
      const heightRatio = availableHeight / canvas.height;
      // نستعمل أكبر نسبة ممكنة مع تصغير طفيف جداً لضمان عدم قص أي جزء من البطاقة
      const ratio = Math.min(widthRatio, heightRatio) * 0.99;

      const imgWidth = canvas.width * ratio;
      const imgHeight = canvas.height * ratio;

      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      pdf.save('teacher-card.pdf');
    } catch (error) {
      console.error('Error generating teacher card PDF', error);
    }
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.teacherCard.photoDataUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }
}


