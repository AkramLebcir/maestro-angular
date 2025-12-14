export class CertificateResponseDto {
  id: number;
  student: {
    id: number;
    firstName: string;
    lastName: string;
  };
  className?: string;
  template?: {
    id: number;
    name: string;
  };
  mainText: string;
  reason: string;
  issueDate: Date;
  academicYear: string;
  signatureName: string;
  createdAt: Date;
}









