import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;

  constructor(private authService: AuthService) {}

  private isAuthEndpoint(url: string): boolean {
    // Do not run refresh logic on auth endpoints themselves
    return url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout');
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    let authReq = req;

    if (token && !this.isAuthEndpoint(req.url)) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
    } else {
      authReq = req.clone({
        withCredentials: true,
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Avoid infinite loops: never try to refresh on auth endpoints
        if (error.status === 401 && !this.isRefreshing && !this.isAuthEndpoint(req.url)) {
          this.isRefreshing = true;

          return this.authService.refreshToken().pipe(
            switchMap((resp) => {
              this.isRefreshing = false;
              const newToken = resp.accessToken;
              const cloned = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`,
                },
                withCredentials: true,
              });
              return next.handle(cloned);
            }),
            catchError(refreshError => {
              this.isRefreshing = false;
              this.authService.logout();
              return throwError(() => refreshError);
            }),
          );
        }

        return throwError(() => error);
      }),
    );
  }
}


