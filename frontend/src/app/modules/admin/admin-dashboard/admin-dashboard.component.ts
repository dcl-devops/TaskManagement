import { Component } from '@angular/core';
import { AuthService } from '../../../core/auth.service';

@Component({
  standalone: false,
  selector: 'app-admin-dashboard',
  template: `
<div class="page-header"><h1>Administration</h1></div>
<div class="admin-cards">
  <a routerLink="/admin/users" class="admin-card card" data-testid="admin-users-card">
    <div class="admin-card-icon" style="background:#eff6ff;color:#2563eb;">&#128101;</div>
    <div class="admin-card-title">Users</div>
    <div class="text-sm text-muted">Manage organization members, roles, and access</div>
  </a>
  <a routerLink="/admin/master-data" class="admin-card card" data-testid="admin-master-card">
    <div class="admin-card-icon" style="background:#f0fdf4;color:#22c55e;">&#127968;</div>
    <div class="admin-card-title">Master Data</div>
    <div class="text-sm text-muted">Companies, Locations, Departments, Designations</div>
  </a>
  <a routerLink="/admin/geography" class="admin-card card" data-testid="admin-geography-card">
    <div class="admin-card-icon" style="background:#fef3c7;color:#d97706;">&#127758;</div>
    <div class="admin-card-title">Geography</div>
    <div class="text-sm text-muted">Countries, States, Cities</div>
  </a>
</div>`,
  styles: [`.admin-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1rem;} .admin-card{padding:1.5rem;display:flex;flex-direction:column;gap:.75rem;cursor:pointer;transition:all var(--transition);&:hover{transform:translateY(-2px);border-color:var(--accent-blue);}} .admin-card-icon{width:48px;height:48px;border-radius:var(--radius);display:flex;align-items:center;justify-content:center;font-size:1.5rem;} .admin-card-title{font-size:1.125rem;font-weight:600;color:var(--text-primary);}`]
})
export class AdminDashboardComponent {
  constructor(public auth: AuthService) {}
}
