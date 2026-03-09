import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let cloned = req;
    // Don't overwrite Authorization header if already set (e.g. superadmin requests)
    if (!req.headers.has('Authorization')) {
      const token = this.auth.token;
      if (token) {
        cloned = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
      }
    }
    return next.handle(cloned).pipe(
      catchError((err: HttpErrorResponse) => {
        // Only auto-logout for non-superadmin routes
        if (err.status === 401 && !req.url.includes('/superadmin/')) {
          this.auth.logout();
        }
        return throwError(() => err);
      })
    );
  }
}
