import { Component, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-superadmin-login',
  template: `
<div class="sa-login-page">
  <div class="sa-login-brand">
    <div class="sa-brand-content">
      <div class="sa-logo">&#9881;</div>
      <h1>TaskFlow</h1>
      <p>Platform Administration</p>
    </div>
  </div>
  <div class="sa-login-form-wrap">
    <div class="sa-login-card">
      <h2>Super Admin Login</h2>
      <p class="text-muted" style="margin-bottom:1.5rem;">Access the platform control panel</p>
      <div class="sa-error" *ngIf="error">{{ error }}</div>
      <div class="form-group"><label>Email</label><input type="email" [(ngModel)]="email" placeholder="admin@taskflow.com" data-testid="sa-email" /></div>
      <div class="form-group"><label>Password</label><input type="password" [(ngModel)]="password" placeholder="Enter password" data-testid="sa-password" (keyup.enter)="login()" /></div>
      <button class="btn btn-primary" style="width:100%;margin-top:.5rem;" (click)="login()" [disabled]="loading" data-testid="sa-login-btn">{{ loading ? 'Signing in...' : 'Sign In' }}</button>
    </div>
  </div>
</div>`,
  styles: [`
    .sa-login-page{display:flex;min-height:100vh;background:var(--bg-secondary);}
    .sa-login-brand{flex:1;background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%);display:flex;align-items:center;justify-content:center;padding:3rem;}
    .sa-brand-content{text-align:center;color:#fff;}
    .sa-logo{font-size:3rem;margin-bottom:1rem;}
    .sa-brand-content h1{font-size:2.5rem;font-weight:700;margin-bottom:.5rem;}
    .sa-brand-content p{font-size:1.125rem;opacity:.7;}
    .sa-login-form-wrap{flex:1;display:flex;align-items:center;justify-content:center;padding:2rem;}
    .sa-login-card{width:100%;max-width:400px;background:var(--bg-card);padding:2.5rem;border-radius:12px;box-shadow:var(--shadow-md);}
    .sa-login-card h2{font-size:1.5rem;font-weight:700;margin-bottom:.25rem;}
    .sa-error{background:#fef2f2;color:#dc2626;padding:.75rem;border-radius:8px;margin-bottom:1rem;font-size:.8125rem;}
    @media(max-width:768px){.sa-login-brand{display:none;}}
  `]
})
export class SuperAdminLoginComponent {
  email = ''; password = ''; loading = false; error = '';
  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {
    if (localStorage.getItem('sa_token')) this.router.navigate(['/superadmin/dashboard']);
  }
  login(): void {
    if (!this.email || !this.password) { this.error = 'Email and password required'; return; }
    this.loading = true; this.error = '';
    this.http.post<any>('/api/superadmin/login', { email: this.email, password: this.password }).subscribe({
      next: r => { localStorage.setItem('sa_token', r.token); localStorage.setItem('sa_user', JSON.stringify(r.user)); this.router.navigate(['/superadmin/dashboard']); },
      error: err => { this.error = err.error?.message || 'Login failed'; this.loading = false; this.cdr.detectChanges(); }
    });
  }
}
