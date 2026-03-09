import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-superadmin-org-detail',
  template: `
<div class="sa-shell">
  <div class="sa-topbar">
    <div style="display:flex;align-items:center;gap:.75rem;">
      <button class="btn btn-ghost btn-sm" (click)="back()">&#8592; Back</button>
      <span style="font-size:1.25rem;">&#9881;</span>
      <h1 style="font-size:1.125rem;font-weight:700;">Organization Details</h1>
    </div>
    <button class="btn btn-ghost btn-sm" (click)="logout()">Logout</button>
  </div>
  <div class="sa-content" *ngIf="org">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
      <div>
        <h2 style="font-size:1.375rem;font-weight:700;">{{ org.name }}</h2>
        <p class="text-sm text-muted">{{ org.domain || 'No domain' }} &middot; Created {{ formatDate(org.created_at) }}</p>
      </div>
      <span class="badge" [class]="org.status === 'active' ? 'badge-open' : 'badge-closed'" style="font-size:.8125rem;">{{ org.status | formatLabel }}</span>
    </div>

    <!-- Usage Stats -->
    <div class="sa-stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:2rem;">
      <div class="sa-stat-card"><div><div class="sa-stat-value">{{ org.user_count }}</div><div class="sa-stat-label">Users</div></div></div>
      <div class="sa-stat-card"><div><div class="sa-stat-value">{{ org.task_count }}</div><div class="sa-stat-label">Tasks</div></div></div>
      <div class="sa-stat-card"><div><div class="sa-stat-value">{{ org.project_count }}</div><div class="sa-stat-label">Projects</div></div></div>
      <div class="sa-stat-card"><div><div class="sa-stat-value">{{ org.meeting_count }}</div><div class="sa-stat-label">Meetings</div></div></div>
    </div>

    <!-- Task Breakdown -->
    <div class="sa-section-card" style="margin-bottom:1.5rem;" *ngIf="org.task_breakdown?.length">
      <h3 style="font-size:1rem;font-weight:600;margin-bottom:1rem;">Task Breakdown</h3>
      <div style="display:flex;gap:1rem;flex-wrap:wrap;">
        <div *ngFor="let t of org.task_breakdown" style="display:flex;align-items:center;gap:.5rem;">
          <span class="badge" [class]="'badge-' + t.status">{{ t.status | formatLabel }}</span>
          <span class="font-bold">{{ t.count }}</span>
        </div>
      </div>
    </div>

    <!-- Users Table -->
    <div class="sa-section-card">
      <h3 style="font-size:1rem;font-weight:600;margin-bottom:1rem;">Users ({{ org.users?.length || 0 }})</h3>
      <table class="data-table" *ngIf="org.users?.length">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th></tr></thead>
        <tbody>
          <tr *ngFor="let u of org.users">
            <td class="font-medium">{{ u.name }}</td>
            <td class="text-sm text-muted">{{ u.email }}</td>
            <td><span class="badge badge-open">{{ u.role | formatLabel }}</span></td>
            <td><span class="badge" [class]="u.status === 'active' ? 'badge-open' : 'badge-on_hold'">{{ u.status | formatLabel }}</span></td>
            <td class="text-sm text-muted">{{ formatDate(u.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div *ngIf="loading" style="padding:4rem;text-align:center;" class="text-muted">Loading...</div>
</div>`,
  styles: [`
    .sa-shell{min-height:100vh;background:var(--bg-secondary);}
    .sa-topbar{display:flex;justify-content:space-between;align-items:center;padding:.75rem 2rem;background:var(--bg-card);border-bottom:1px solid var(--border-color);position:sticky;top:0;z-index:10;}
    .sa-content{max-width:1200px;margin:0 auto;padding:2rem;}
    .sa-stats-grid{display:grid;gap:1rem;}
    .sa-stat-card{display:flex;align-items:center;gap:1rem;padding:1.25rem;background:var(--bg-card);border-radius:10px;border:1px solid var(--border-color);box-shadow:var(--shadow-sm);}
    .sa-stat-value{font-size:1.5rem;font-weight:700;line-height:1.2;}
    .sa-stat-label{font-size:.75rem;color:var(--text-muted);margin-top:.125rem;}
    .sa-section-card{background:var(--bg-card);border-radius:10px;border:1px solid var(--border-color);padding:1.5rem;box-shadow:var(--shadow-sm);}
  `]
})
export class SuperAdminOrgDetailComponent implements OnInit {
  org: any = null;
  loading = true;

  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const token = localStorage.getItem('sa_token');
    if (!token) { this.router.navigate(['/superadmin/login']); return; }
    const id = this.route.snapshot.params['id'];
    this.http.get<any>(`/api/superadmin/organizations/${id}`, { headers: this.getHeaders() }).subscribe({
      next: r => { this.org = r; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.router.navigate(['/superadmin/dashboard']); }
    });
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem('sa_token') });
  }

  formatDate(d: string): string { return d ? new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'; }
  back(): void { this.router.navigate(['/superadmin/dashboard']); }
  logout(): void { localStorage.removeItem('sa_token'); localStorage.removeItem('sa_user'); this.router.navigate(['/superadmin/login']); }
}
