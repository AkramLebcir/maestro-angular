import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface CertificateTemplate {
  id: number;
  name: string;
  description: string;
  defaultMainText: string;
  defaultReason: string;
  defaultAcademicYear: string;
  defaultSignatureLabel: string;
}

export interface IssueCertificatePayload {
  studentId: number;
  templateId: number;
  mainText: string;
  reason: string;
  issueDate: string; // ISO string
  academicYear: string;
  signatureName: string;
}

export interface CertificateIssueResponse {
  id: number;
  mainText: string;
  reason: string;
  issueDate: string;
  academicYear: string;
  signatureName: string;
}

@Injectable({
  providedIn: 'root',
})
export class CertificateService {
  constructor(private api: ApiService) {}

  getTemplates(): Observable<CertificateTemplate[]> {
    return this.api.get<CertificateTemplate[]>('/certificates/templates');
  }

  getCertificates(studentId?: number, classId?: number): Observable<any[]> {
    let queryParams = '';
    if (studentId) queryParams += `?studentId=${studentId}`;
    if (classId) queryParams += `${queryParams ? '&' : '?'}classId=${classId}`;
    return this.api.get<any[]>(`/certificates${queryParams}`);
  }

  issueCertificate(payload: IssueCertificatePayload): Observable<CertificateIssueResponse> {
    return this.api.post<CertificateIssueResponse>('/certificates', payload);
  }
}

