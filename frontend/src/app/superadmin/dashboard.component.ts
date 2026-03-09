import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-superadmin-dashboard',
  template: `
<div class="sa-shell">
  <div class="sa-topbar">
    <div style="display:flex;align-items:center;gap:.75rem;">
      <span style="font-size:1.25rem;">&#9881;</span>
      <h1 style="font-size:1.125rem;font-weight:700;">TaskFlow Admin</h1>
    </div>
    <div style="display:flex;align-items:center;gap:1rem;">
      <span class="text-sm text-muted">{{ adminName }}</span>
      <button class="btn btn-ghost btn-sm" (click)="logout()">Logout</button>
    </div>
  </div>
  <div class="sa-content">
    <h2 style="margin-bottom:1.5rem;font-size:1.375rem;font-weight:700;">Platform Overview</h2>

    <!-- Stats Cards -->
    <div class="sa-stats-grid">
      <div class="sa-stat-card">
        <div class="sa-stat-icon" style="background:#eff6ff;color:#3b82f6;">&#127970;</div>
        <div><div class="sa-stat-value">{{ stats.total_orgs }}</div><div class="sa-stat-label">Organizations</div></div>
      </div>
      <div class="sa-stat-card">
        <div class="sa-stat-icon" style="background:#f0fdf4;color:#22c55e;">&#128101;</div>
        <div><div class="sa-stat-value">{{ stats.total_users }}</div><div class="sa-stat-label">Total Users</div></div>
      </div>
      <div class="sa-stat-card">
        <div class="sa-stat-icon" style="background:#fefce8;color:#eab308;">&#9745;</div>
        <div><div class="sa-stat-value">{{ stats.total_tasks }}</div><div class="sa-stat-label">Total Tasks</div></div>
      </div>
      <div class="sa-stat-card">
        <div class="sa-stat-icon" style="background:#faf5ff;color:#a855f7;">&#9650;</div>
        <div><div class="sa-stat-value">{{ stats.total_projects }}</div><div class="sa-stat-label">Total Projects</div></div>
      </div>
      <div class="sa-stat-card">
        <div class="sa-stat-icon" style="background:#f0f9ff;color:#0ea5e9;">&#128197;</div>
        <div><div class="sa-stat-value">{{ stats.total_meetings }}</div><div class="sa-stat-label">Total Meetings</div></div>
      </div>
    </div>

    <!-- Orgs Table -->
    <div class="sa-section-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <h3 style="font-size:1rem;font-weight:600;">Organizations</h3>
        <span class="text-sm text-muted">{{ orgs.length }} total</span>
      </div>
      <div *ngIf="loading" style="padding:2rem;text-align:center;" class="text-muted">Loading...</div>
      <table class="data-table" *ngIf="!loading && orgs.length > 0">
        <thead>
          <tr>
            <th>Organization</th>
            <th>Users</th>
            <th>Tasks</th>
            <th>Projects</th>
            <th>Meetings</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let o of orgs" style="cursor:pointer;">
            <td (click)="openOrg(o.id)"><span class="font-medium">{{ o.name }}</span><br/><span class="text-xs text-muted">{{ o.domain || '-' }}</span></td>
            <td (click)="openOrg(o.id)">{{ o.user_count }}</td>
            <td (click)="openOrg(o.id)">{{ o.task_count }}</td>
            <td (click)="openOrg(o.id)">{{ o.project_count }}</td>
            <td (click)="openOrg(o.id)">{{ o.meeting_count }}</td>
            <td><span class="badge" [class]="o.status === 'active' ? 'badge-open' : 'badge-closed'">{{ o.status | formatLabel }}</span></td>
            <td class="text-sm text-muted">{{ formatDate(o.created_at) }}</td>
            <td>
              <div style="display:flex;gap:.375rem;">
                <button class="btn btn-ghost btn-sm" (click)="toggleOrg(o)" [title]="o.status === 'active' ? 'Deactivate' : 'Activate'">{{ o.status === 'active' ? 'Deactivate' : 'Activate' }}</button>
                <button class="btn btn-ghost btn-sm" style="color:#ef4444;" (click)="deleteOrg(o)" title="Delete">Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div *ngIf="!loading && orgs.length === 0" style="padding:2rem;text-align:center;" class="text-muted">No organizations yet</div>
    </div>
  </div>
</div>`,
  styles: [`
    .sa-shell{min-height:100vh;background:var(--bg-secondary);}
    .sa-topbar{display:flex;justify-content:space-between;align-items:center;padding:.75rem 2rem;background:var(--bg-card);border-bottom:1px solid var(--border-color);position:sticky;top:0;z-index:10;}
    .sa-content{max-width:1200px;margin:0 auto;padding:2rem;}
    .sa-stats-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:1rem;margin-bottom:2rem;}
    .sa-stat-card{display:flex;align-items:center;gap:1rem;padding:1.25rem;background:var(--bg-card);border-radius:10px;border:1px solid var(--border-color);box-shadow:var(--shadow-sm);}
    .sa-stat-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.25rem;flex-shrink:0;}
    .sa-stat-value{font-size:1.5rem;font-weight:700;line-height:1.2;}
    .sa-stat-label{font-size:.75rem;color:var(--text-muted);margin-top:.125rem;}
    .sa-section-card{background:var(--bg-card);border-radius:10px;border:1px solid var(--border-color);padding:1.5rem;box-shadow:var(--shadow-sm);}
    @media(max-width:900px){.sa-stats-grid{grid-template-columns:repeat(2,1fr);}}
  `]
})
export class SuperAdminDashboardComponent implements OnInit {
  stats: any = {};
  orgs: any[] = [];
  loading = true;
  adminName = '';

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const token = localStorage.getItem('sa_token');
    if (!token) { this.router.navigate(['/superadmin/login']); return; }
    const user = JSON.parse(localStorage.getItem('sa_user') || '{}');
    this.adminName = user.name || 'Admin';
    this.loadData();
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem('sa_token') });
  }

  loadData(): void {
    this.loading = true;
    this.http.get<any>('/api/superadmin/stats', { headers: this.getHeaders() }).subscribe({
      next: r => { this.stats = r; this.orgs = r.recent_orgs || []; this.cdr.detectChanges(); },
      error: () => { this.router.navigate(['/superadmin/login']); }
    });
    this.http.get<any[]>('/api/superadmin/organizations', { headers: this.getHeaders() }).subscribe({
      next: r => { this.orgs = r; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  openOrg(id: number): void { this.router.navigate(['/superadmin/organizations', id]); }

  toggleOrg(org: any): void {
    const newStatus = org.status === 'active' ? 'inactive' : 'active';
    if (!confirm(`${newStatus === 'inactive' ? 'Deactivate' : 'Activate'} "${org.name}"?`)) return;
    this.http.patch(`/api/superadmin/organizations/${org.id}/status`, { status: newStatus }, { headers: this.getHeaders() }).subscribe({
      next: () => { org.status = newStatus; this.cdr.detectChanges(); }
    });
  }

  deleteOrg(org: any): void {
    if (!confirm(`DELETE "${org.name}" and ALL its data? This cannot be undone.`)) return;
    this.http.delete(`/api/superadmin/organizations/${org.id}`, { headers: this.getHeaders() }).subscribe({
      next: () => { this.orgs = this.orgs.filter(o => o.id !== org.id); this.stats.total_orgs--; this.cdr.detectChanges(); }
    });
  }

  formatDate(d: string): string { return d ? new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'; }
  logout(): void { localStorage.removeItem('sa_token'); localStorage.removeItem('sa_user'); this.router.navigate(['/superadmin/login']); }
}
