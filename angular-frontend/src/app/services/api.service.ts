import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

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
    return this.http.get<T>(`${this.apiUrl}${endpoint}`);
  }

  /**
   * Generic POST request
   */
  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}${endpoint}`, body);
  }

  /**
   * Generic PUT request
   */
  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}${endpoint}`, body);
  }

  /**
   * Generic PATCH request
   */
  patch<T>(endpoint: string, body: any): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}${endpoint}`, body);
  }

  /**
   * Generic DELETE request
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}${endpoint}`);
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

    return this.http.post(`${this.apiUrl}/pedagogical-docs`, formData);
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
    return this.http.get<any[]>(`${this.apiUrl}/pedagogical-docs`, { params });
  }
}
