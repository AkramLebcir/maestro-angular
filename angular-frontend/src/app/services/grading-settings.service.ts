import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface CustomAssessmentColumn {
  id?: string;
  name: string;
  maxScore: number;
}

export interface GradingSettings {
  id?: number;
  classId: number;
  notebookCorrectionMaxScore: number;
  dutyMaxScore: number;
  attendanceMaxScore: number;
  attendanceAutoApply: boolean;
  behaviorMaxScore: number;
  behaviorAutoApply: boolean;
  customAssessmentColumns?: CustomAssessmentColumn[];
  includeOralExpression: boolean;
}

export interface BulkApplySettingsDto {
  classIds: number[];
  notebookCorrectionMaxScore?: number;
  dutyMaxScore?: number;
  attendanceMaxScore?: number;
  attendanceAutoApply?: boolean;
  behaviorMaxScore?: number;
  behaviorAutoApply?: boolean;
  customAssessmentColumns?: CustomAssessmentColumn[];
  includeOralExpression?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class GradingSettingsService {
  constructor(private api: ApiService) {}

  getAll(): Observable<GradingSettings[]> {
    return this.api.get<GradingSettings[]>('/grading-settings');
  }

  getByClassId(classId: number): Observable<GradingSettings | null> {
    return this.api.get<GradingSettings | null>(`/grading-settings/class/${classId}`);
  }

  create(settings: GradingSettings): Observable<GradingSettings> {
    return this.api.post<GradingSettings>('/grading-settings', settings);
  }

  update(classId: number, settings: Partial<GradingSettings>): Observable<GradingSettings> {
    return this.api.patch<GradingSettings>(`/grading-settings/class/${classId}`, settings);
  }

  bulkApply(bulkDto: BulkApplySettingsDto): Observable<GradingSettings[]> {
    return this.api.post<GradingSettings[]>('/grading-settings/bulk-apply', bulkDto);
  }

  delete(classId: number): Observable<void> {
    return this.api.delete<void>(`/grading-settings/class/${classId}`);
  }
}

