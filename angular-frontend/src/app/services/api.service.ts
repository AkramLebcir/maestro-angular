import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  /**
   * Example: Get data from backend
   */
  getHello(): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/`, { responseType: 'text' as 'json' });
  }

  /**
   * Generic GET request
   */
  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}${endpoint}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Generic POST request
   */
  post<T>(endpoint: string, body: any, options?: { headers?: HttpHeaders }): Observable<T> {
    const headers = options?.headers !== undefined ? options.headers : this.getHeaders();
    return this.http.post<T>(`${this.apiUrl}${endpoint}`, body, { headers });
  }

  /**
   * Upload medical certificate file
   */
  uploadMedicalCertificate(file: File): Observable<{ fileUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    // For file uploads, we need Authorization but let browser set Content-Type
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.post<{ fileUrl: string }>(`${this.apiUrl}/students/upload-medical-certificate`, formData, {
      headers
    });
  }

  /**
   * Generic PUT request
   */
  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}${endpoint}`, body, {
      headers: this.getHeaders()
    });
  }

  /**
   * Generic PATCH request
   */
  patch<T>(endpoint: string, body: any): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}${endpoint}`, body, {
      headers: this.getHeaders()
    });
  }

  /**
   * Generic DELETE request
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}${endpoint}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Upload pedagogical document (PDF / image / Word)
   */
  uploadPedagogicalDocument(payload: {
    title: string;
    type: string;
    level: string;
    subject?: string;
    file: File;
  }): Observable<any> {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('type', payload.type);
    formData.append('level', payload.level);
    if (payload.subject) {
      formData.append('subject', payload.subject);
    }
    formData.append('file', payload.file);

    return this.http.post(`${this.apiUrl}/pedagogical-docs`, formData, {
      headers: this.getHeaders()
    });
  }

  /**
   * List pedagogical documents with optional filters
   */
  getPedagogicalDocuments(filters?: {
    level?: string;
    type?: string;
  }): Observable<any[]> {
    let params = new HttpParams();
    if (filters?.level) {
      params = params.set('level', filters.level);
    }
    if (filters?.type) {
      params = params.set('type', filters.type);
    }
    return this.http.get<any[]>(`${this.apiUrl}/pedagogical-docs`, {
      params,
      headers: this.getHeaders()
    });
  }

  /**
   * Delete pedagogical document
   */
  deletePedagogicalDocument(documentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/pedagogical-docs/${documentId}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Generate lesson plan using AI
   */
  generateLessonPlan(payload: {
    level: string;
    section: string;
    conceptualField: string;
    conceptualUnit: string;
    learningObjectives: string;
    targetCompetency: string;
    classLevel: string;
    subject: string;
    sessionDuration: number;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/pedagogical-docs/generate-lesson-plan`, payload, {
      headers: this.getHeaders()
    });
  }
}
