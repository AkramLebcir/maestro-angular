import { ErrorHandler, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandler implements ErrorHandler {

  handleError(error: any): void {
    // Handle reCAPTCHA timeout errors specifically
    if (error && typeof error === 'string' && error.includes('Timeout')) {
      console.warn('reCAPTCHA timeout error handled:', error);
      return;
    }

    // Handle promise rejections with timeout
    if (error && error.message && error.message.includes('Timeout')) {
      console.warn('Promise timeout error handled:', error.message);
      return;
    }

    // For other errors, log to console in development
    console.error('Unhandled error:', error);

    // In production, you might want to send errors to a logging service
    // this.loggingService.logError(error);
  }
}

