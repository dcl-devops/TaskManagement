import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-customer-detail',
  template: `
<div *ngIf="loading" class="loading-overlay"><div class="spinner"></div></div>
<ng-container *ngIf="customer && !loading">
  <div class="page-header">
    <div style="display:flex;align-items:center;gap:0.75rem;">
      <button class="btn btn-ghost btn-sm" routerLink="/customers" data-testid="back-btn">&larr; Back</button>
      <span class="text-sm text-muted">{{ customer.customer_code }}</span>
      <h1 style="font-size:1.25rem;">{{ customer.name }}</h1>
      <span class="status-badge" [class.active]="customer.status === 'active'" [class.inactive]="customer.status !== 'active'">{{ customer.status | formatLabel }}</span>
    </div>
    <div class="header-actions">
      <a [routerLink]="['/customers', customer.id, 'edit']" class="btn btn-secondary btn-sm" data-testid="edit-customer-btn">Edit</a>
    </div>
  </div>
  <div class="detail-grid">
    <div class="card info-card">
      <div class="detail-header">Customer Info</div>
      <div class="detail-list">
        <div class="detail-row"><span class="detail-label">Industry</span><span>{{ customer.industry || '-' }}</span></div>
        <div class="detail-row"><span class="detail-label">City</span><span>{{ customer.city || '-' }}</span></div>
        <div class="detail-row"><span class="detail-label">State</span><span>{{ customer.state || '-' }}</span></div>
        <div class="detail-row"><span class="detail-label">Country</span><span>{{ customer.country || '-' }}</span></div>
      </div>
      <div class="detail-header" style="margin-top:.5rem;">Contact</div>
      <div class="detail-list">
        <div class="detail-row"><span class="detail-label">Person</span><span>{{ customer.contact_person || '-' }}</span></div>
        <div class="detail-row"><span class="detail-label">Mobile</span><span>{{ customer.mobile || '-' }}</span></div>
        <div class="detail-row"><span class="detail-label">Email</span><span>{{ customer.email || '-' }}</span></div>
      </div>
    </div>
    <div class="main-content">
      <div *ngIf="customer.address" class="card" style="margin-bottom:1rem;">
        <div class="card-body"><p class="text-sm"><strong>Address:</strong> {{ customer.address }}</p></div>
      </div>
      <div class="card" style="margin-bottom:1rem;">
        <div class="card-header"><h3>Projects ({{ customer.projects?.length || 0 }})</h3></div>
        <div class="table-container" style="border:none;">
          <table>
            <thead><tr><th>Project #</th><th>Title</th><th>Owner</th><th>Tasks</th><th>Meetings</th><th>Status</th></tr></thead>
            <tbody>
              <tr *ngFor="let p of customer.projects" [routerLink]="['/projects', p.id]" style="cursor:pointer;">
                <td class="text-sm text-muted">{{ p.project_number }}</td>
                <td class="text-sm">{{ p.title }}</td>
                <td class="text-sm">{{ p.owner_name || '-' }}</td>
                <td class="text-sm">{{ p.task_count || 0 }}</td>
                <td class="text-sm">{{ p.meeting_count || 0 }}</td>
                <td><span class="badge" [class]="getStatusClass(p.status)">{{ p.status | formatLabel }}</span></td>
              </tr>
              <tr *ngIf="!customer.projects?.length"><td colspan="6" class="text-sm text-muted" style="text-align:center;padding:1rem;">No projects linked</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="card" style="margin-bottom:1rem;">
        <div class="card-header"><h3>Meetings ({{ customer.meetings?.length || 0 }})</h3></div>
        <div class="table-container" style="border:none;">
          <table>
            <thead><tr><th>Meeting #</th><th>Title</th><th>Project</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              <tr *ngFor="let m of customer.meetings" [routerLink]="['/meetings', m.id]" style="cursor:pointer;">
                <td class="text-sm text-muted">{{ m.meeting_number }}</td>
                <td class="text-sm">{{ m.title }}</td>
                <td class="text-sm">{{ m.project_title || '-' }}</td>
                <td class="text-sm">{{ formatDate(m.meeting_date) }}</td>
                <td><span class="badge" [class]="getStatusClass(m.status)">{{ m.status | formatLabel }}</span></td>
              </tr>
              <tr *ngIf="!customer.meetings?.length"><td colspan="5" class="text-sm text-muted" style="text-align:center;padding:1rem;">No meetings</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Tasks ({{ customer.tasks?.length || 0 }})</h3></div>
        <div class="table-container" style="border:none;">
          <table>
            <thead><tr><th>Task #</th><th>Title</th><th>Assigned To</th><th>Priority</th><th>Due Date</th><th>Status</th></tr></thead>
            <tbody>
              <tr *ngFor="let t of customer.tasks" [routerLink]="['/tasks', t.id]" style="cursor:pointer;">
                <td class="text-sm text-muted">{{ t.task_number }}</td>
                <td class="text-sm">{{ t.title }}</td>
                <td class="text-sm">{{ t.assigned_to_name || '-' }}</td>
                <td><span class="badge" [class]="'badge-' + t.priority">{{ t.priority | formatLabel }}</span></td>
                <td class="text-sm">{{ formatDate(t.due_date) }}</td>
                <td><span class="badge" [class]="getStatusClass(t.status)">{{ t.status | formatLabel }}</span></td>
              </tr>
              <tr *ngIf="!customer.tasks?.length"><td colspan="6" class="text-sm text-muted" style="text-align:center;padding:1rem;">No tasks</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</ng-container>`,
  styles: [`
    .detail-grid { display: grid; grid-template-columns: 280px 1fr; gap: 1.25rem; }
    @media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }
    .info-card { align-self: flex-start; }
    .detail-header { font-size: 0.85rem; font-weight: 600; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); }
    .detail-list { padding: 0.5rem 1rem; }
    .detail-row { display: flex; justify-content: space-between; padding: 0.35rem 0; font-size: 0.85rem; }
    .detail-label { color: var(--text-muted); }
    .card-header { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); }
    .card-header h3 { font-size: 0.9rem; font-weight: 600; }
    .card-body { padding: 0.75rem 1rem; }
  `]
})
export class CustomerDetailComponent implements OnInit {
  customer: any = null;
  loading = true;

  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.http.get<any>(`/api/customers/${id}`).subscribe({
      next: c => { this.customer = c; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  getStatusClass(s: string): string {
    const m: any = { active: 'badge-open', on_hold: 'badge-on_hold', completed: 'badge-resolved', cancelled: 'badge-closed', planning: 'badge-in_progress', open: 'badge-open', closed: 'badge-closed' };
    return m[s] || '';
  }

  formatDate(d: string): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
