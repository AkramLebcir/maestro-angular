import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export type BaseColumnKey = 'notebook_correction' | 'duty' | 'attendance' | 'behavior';

export interface BaseColumnConfig {
  key: BaseColumnKey;
  label?: string;
  visible?: boolean;
}

export const DEFAULT_BASE_COLUMN_SETTINGS: BaseColumnConfig[] = [
  { key: 'notebook_correction', visible: true },
  { key: 'duty', visible: true },
  { key: 'attendance', visible: true },
  { key: 'behavior', visible: true },
];

export interface CustomAssessmentColumn {
  id?: string;
  name: string;
  maxScore: number;
}

export type LanguageCode = 'AR' | 'FR' | 'EN' | 'ES' | 'IT' | 'DE' | 'TR';

export interface RatingRangeConfig {
  min: number;
  max?: number; // undefined means infinity
  ratings: {
    AR?: string;
    FR?: string;
    EN?: string;
    ES?: string;
    IT?: string;
    DE?: string;
    TR?: string;
  };
}

export interface GuidanceRangeConfig {
  min: number;
  max?: number; // undefined means infinity
  guidance: {
    AR?: string;
    FR?: string;
    EN?: string;
    ES?: string;
    IT?: string;
    DE?: string;
    TR?: string;
  };
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
  baseColumnSettings?: BaseColumnConfig[];
  includeOralExpression: boolean;
  customRatings?: RatingRangeConfig[];
  customGuidance?: GuidanceRangeConfig[];
}

export interface BulkApplySettingsDto {
  classIds?: number[];
  applyToAllClasses?: boolean;
  notebookCorrectionMaxScore?: number;
  dutyMaxScore?: number;
  attendanceMaxScore?: number;
  attendanceAutoApply?: boolean;
  behaviorMaxScore?: number;
  behaviorAutoApply?: boolean;
  customAssessmentColumns?: CustomAssessmentColumn[];
  baseColumnSettings?: BaseColumnConfig[];
  includeOralExpression?: boolean;
  customRatings?: RatingRangeConfig[];
  ratingsLanguage?: LanguageCode;
  customGuidance?: GuidanceRangeConfig[];
  guidanceLanguage?: LanguageCode;
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

