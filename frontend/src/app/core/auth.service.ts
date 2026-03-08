import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  org_id: number;
  org_name: string;
  department_name?: string;
  location_name?: string;
  force_password_change: boolean;
  avatar_url?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { this.currentUserSubject.next(JSON.parse(stored)); } catch { }
    }
  }

  get currentUser(): User | null { return this.currentUserSubject.value; }
  get token(): string | null { return localStorage.getItem('token'); }
  get isLoggedIn(): boolean { return !!this.token && !!this.currentUser; }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>('/api/auth/login', { email, password }).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        this.currentUserSubject.next(res.user);
      })
    );
  }

  signup(data: any): Observable<any> {
    return this.http.post<any>('/api/auth/signup', data).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        this.currentUserSubject.next(res.user);
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post('/api/auth/change-password', { currentPassword, newPassword }).pipe(
      tap(() => {
        const user = this.currentUser;
        if (user) {
          user.force_password_change = false;
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUserSubject.next({ ...user });
        }
      })
    );
  }

  refreshMe(): void {
    this.http.get<User>('/api/auth/me').subscribe({
      next: user => {
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      }
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  hasRole(...roles: string[]): boolean {
    return roles.includes(this.currentUser?.role || '');
  }

  isAdmin(): boolean { return this.hasRole('owner', 'admin'); }
  isManagerOrAbove(): boolean { return this.hasRole('owner', 'admin', 'manager'); }
}
