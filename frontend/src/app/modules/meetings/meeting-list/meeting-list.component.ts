import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-meeting-list',
  template: `
    <div class="page-header">
      <h1>Meetings</h1>
      <div class="header-actions">
        <span class="text-sm text-muted">{{ filteredMeetings.length }} meetings</span>
        <button class="btn btn-primary" routerLink="/meetings/new" data-testid="new-meeting-btn">+ New Meeting</button>
      </div>
    </div>
    <div class="card filter-bar" style="padding:0.75rem 1rem;margin-bottom:1rem;">
      <div style="display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap;">
        <select [(ngModel)]="filterCustomer" (change)="onFilterChange()" data-testid="filter-customer" style="width:auto;min-width:150px;height:36px;">
          <option value="">All Customers</option>
          <option *ngFor="let c of filteredCustomers" [value]="c.id">{{ c.name }}</option>
        </select>
        <select [(ngModel)]="filterProject" (change)="onFilterChange()" data-testid="filter-project" style="width:auto;min-width:150px;height:36px;">
          <option value="">All Projects</option>
          <option *ngFor="let p of filteredProjects" [value]="p.id">{{ p.title }}</option>
        </select>
        <select [(ngModel)]="filterStatus" (change)="onFilterChange()" data-testid="filter-status" style="width:auto;min-width:130px;height:36px;">
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button class="btn btn-ghost btn-sm" (click)="clearFilters()">Clear</button>
      </div>
    </div>
    <div *ngIf="loading" class="loading-overlay"><div class="spinner"></div></div>
    <div class="meeting-grid" *ngIf="!loading">
      <div class="card meeting-card" *ngFor="let m of filteredMeetings" (click)="open(m.id)" [attr.data-testid]="'meeting-' + m.id">
        <div class="meeting-header">
          <span class="meeting-number text-sm text-muted">{{ m.meeting_number }}</span>
          <span class="badge" [class]="getStatusClass(m.status)">{{ m.status | formatLabel }}</span>
        </div>
        <h3 class="meeting-title">{{ m.title }}</h3>
        <div class="meeting-meta">
          <span class="text-xs text-muted">{{ formatDate(m.meeting_date) }}</span>
          <span class="text-xs text-muted" *ngIf="m.project_title">Project: {{ m.project_title }}</span>
        </div>
        <div class="meeting-summary">
          <span class="summary-label">Tasks</span>
          <span class="summary-vals">{{ m.task_count || 0 }} total &bull; {{ m.completed_tasks || 0 }} done &bull; {{ m.pending_tasks || 0 }} pending</span>
        </div>
      </div>
      <div *ngIf="filteredMeetings.length === 0" class="empty-state">
        <div class="empty-icon">&#9830;</div>
        <h3>No meetings yet</h3>
        <p>Create your first meeting to get started</p>
      </div>
    </div>
  `,
  styles: [`
    .meeting-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; }
    .meeting-card { padding: 1.25rem; cursor: pointer; transition: all var(--transition);
      &:hover { border-color: var(--accent-blue); transform: translateY(-2px); box-shadow: var(--shadow-sm); }
    }
    .meeting-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .meeting-title { font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; }
    .meeting-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .meeting-summary { border-top: 1px solid var(--border-color); padding-top: 0.6rem; display: flex; justify-content: space-between; align-items: center; }
    .summary-label { font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); }
    .summary-vals { font-size: 0.7rem; color: var(--text-muted); }
    .empty-state { grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted); }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
  `]
})
export class MeetingListComponent implements OnInit {
  meetings: any[] = [];
  filteredMeetings: any[] = [];
  allCustomers: any[] = [];
  allProjects: any[] = [];
  filteredCustomers: any[] = [];
  filteredProjects: any[] = [];
  loading = true;
  filterCustomer = '';
  filterProject = '';
  filterStatus = '';

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.http.get<any[]>('/api/customers').subscribe({ next: r => { this.allCustomers = r; this.updateFilteredDropdowns(); this.cdr.detectChanges(); } });
    this.http.get<any[]>('/api/projects').subscribe({ next: r => { this.allProjects = r; this.updateFilteredDropdowns(); this.cdr.detectChanges(); } });
    this.load();
  }

  load(): void {
    this.loading = true;
    const params: any = {};
    if (this.filterCustomer) params['customer_id'] = this.filterCustomer;
    if (this.filterProject) params['project_id'] = this.filterProject;
    if (this.filterStatus) params['status'] = this.filterStatus;
    this.http.get<any[]>('/api/meetings', { params }).subscribe({
      next: r => { this.meetings = r; this.filteredMeetings = r; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  onFilterChange(): void {
    this.updateFilteredDropdowns();
    this.load();
  }

  updateFilteredDropdowns(): void {
    // If customer selected, narrow projects
    if (this.filterCustomer) {
      const custId = parseInt(this.filterCustomer);
      this.filteredProjects = this.allProjects.filter(p => p.customer_id === custId);
    } else {
      this.filteredProjects = [...this.allProjects];
    }

    // If project selected, narrow customers
    if (this.filterProject) {
      const proj = this.allProjects.find(p => p.id === parseInt(this.filterProject));
      if (proj?.customer_id) {
        this.filteredCustomers = this.allCustomers.filter(c => c.id === proj.customer_id);
      } else {
        this.filteredCustomers = [...this.allCustomers];
      }
    } else {
      this.filteredCustomers = [...this.allCustomers];
    }
  }

  clearFilters(): void {
    this.filterCustomer = ''; this.filterProject = ''; this.filterStatus = '';
    this.updateFilteredDropdowns();
    this.load();
  }

  open(id: number): void { this.router.navigate(['/meetings', id]); }

  getStatusClass(s: string): string {
    const m: any = { open: 'badge-open', closed: 'badge-closed', cancelled: 'badge-closed' };
    return m[s] || '';
  }

  formatDate(d: string): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
