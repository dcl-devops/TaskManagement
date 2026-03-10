import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-project-list',
  template: `
    <div class="page-header">
      <h1>Projects</h1>
      <div class="header-actions">
        <span class="text-sm text-muted">{{ filteredProjects.length }} projects</span>
        <button class="btn btn-primary" routerLink="/projects/new" data-testid="new-project-btn">+ New Project</button>
      </div>
    </div>
    <!-- Filters & Sort -->
    <div class="card filter-bar">
      <div class="filter-row">
        <select [(ngModel)]="filterOwner" (change)="applyFilters()" data-testid="filter-owner">
          <option value="">All Owners</option>
          <option *ngFor="let u of owners" [value]="u">{{ u }}</option>
        </select>
        <select [(ngModel)]="filterPriority" (change)="applyFilters()" data-testid="filter-priority">
          <option value="">All Priorities</option>
          <option value="critical">Critical</option><option value="high">High</option>
          <option value="medium">Medium</option><option value="low">Low</option>
        </select>
        <select [(ngModel)]="filterStatus" (change)="applyFilters()" data-testid="filter-status">
          <option value="">All Status</option>
          <option value="planning">Planning</option><option value="active">Active</option>
          <option value="on_hold">On Hold</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
        </select>
        <select [(ngModel)]="sortField" (change)="applyFilters()" data-testid="sort-field">
          <option value="created_at">Sort: Created Date</option>
          <option value="start_date">Sort: Start Date</option>
          <option value="title">Sort: Name</option>
          <option value="project_number">Sort: Code</option>
          <option value="priority">Sort: Priority</option>
        </select>
        <button class="btn btn-ghost btn-sm" (click)="toggleSortDir()">{{ sortDir === 'asc' ? '↑ Asc' : '↓ Desc' }}</button>
        <button class="btn btn-ghost btn-sm" (click)="clearFilters()">Clear</button>
      </div>
    </div>
    <div *ngIf="loading" class="loading-overlay"><div class="spinner"></div></div>
    <div class="project-grid" *ngIf="!loading">
      <div class="card project-card" *ngFor="let p of filteredProjects" (click)="open(p.id)" [attr.data-testid]="'project-' + p.id">
        <div class="project-header">
          <span class="project-number text-sm text-muted">{{ p.project_number }}</span>
          <span class="badge" [class]="getStatusClass(p.status)">{{ p.status | formatLabel }}</span>
        </div>
        <h3 class="project-title">{{ p.title }}</h3>
        <div class="project-meta">
          <span class="text-xs text-muted">Owner: {{ p.owner_name || '-' }}</span>
          <span class="badge" [class]="'badge-' + p.priority">{{ p.priority | formatLabel }}</span>
        </div>
        <div class="project-progress">
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" [style.width.%]="getProgress(p)"></div>
          </div>
          <span class="text-xs text-muted">{{ getProgress(p) }}% complete</span>
        </div>
        <div class="project-summary">
          <div class="summary-item">
            <span class="summary-label">Meetings</span>
            <span class="summary-vals">{{ p.total_meetings || 0 }} total &bull; {{ p.completed_meetings || 0 }} done &bull; {{ p.pending_meetings || 0 }} pending</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Tasks</span>
            <span class="summary-vals">{{ p.total_tasks || 0 }} total &bull; {{ p.completed_tasks || 0 }} done &bull; {{ p.pending_tasks || 0 }} pending</span>
          </div>
        </div>
      </div>
      <div *ngIf="filteredProjects.length === 0" class="empty-state">
        <div class="empty-icon">&#9650;</div>
        <h3>No projects found</h3>
        <p>{{ projects.length > 0 ? 'Try adjusting your filters' : 'Create your first project to get started' }}</p>
      </div>
    </div>
  `,
  styles: [`
    .filter-bar { padding: 0.75rem 1rem; margin-bottom: 1rem; }
    .filter-row { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
    .filter-row select { width: auto; min-width: 130px; height: 36px; }
    .project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1rem; }
    .project-card { padding: 1.25rem; cursor: pointer; transition: all var(--transition);
      &:hover { border-color: var(--accent-blue); transform: translateY(-2px); box-shadow: var(--shadow-sm); }
    }
    .project-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .project-title { font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; }
    .project-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .project-progress { margin-bottom: 0.75rem; }
    .progress-bar-bg { height: 5px; background: var(--bg-tertiary); border-radius: 3px; overflow: hidden; margin-bottom: 4px; }
    .progress-bar-fill { height: 100%; background: var(--accent-blue); border-radius: 3px; transition: width 0.5s ease; }
    .project-summary { border-top: 1px solid var(--border-color); padding-top: 0.6rem; }
    .summary-item { display: flex; justify-content: space-between; align-items: center; padding: 0.2rem 0; }
    .summary-label { font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); }
    .summary-vals { font-size: 0.7rem; color: var(--text-muted); }
    .empty-state { grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted); }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
  `]
})
export class ProjectListComponent implements OnInit {
  projects: any[] = [];
  filteredProjects: any[] = [];
  owners: string[] = [];
  loading = true;
  filterOwner = '';
  filterPriority = '';
  filterStatus = '';
  sortField = 'created_at';
  sortDir: 'asc' | 'desc' = 'desc';
  private priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.http.get<any[]>('/api/projects').subscribe({
      next: r => {
        this.projects = r;
        this.owners = [...new Set(r.map(p => p.owner_name).filter(Boolean))];
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  applyFilters(): void {
    let list = [...this.projects];
    if (this.filterOwner) list = list.filter(p => p.owner_name === this.filterOwner);
    if (this.filterPriority) list = list.filter(p => p.priority === this.filterPriority);
    if (this.filterStatus) list = list.filter(p => p.status === this.filterStatus);
    list.sort((a, b) => {
      let va: any, vb: any;
      switch (this.sortField) {
        case 'title': va = a.title || ''; vb = b.title || ''; break;
        case 'project_number': va = a.project_number || ''; vb = b.project_number || ''; break;
        case 'priority': va = this.priorityOrder[a.priority] ?? 99; vb = this.priorityOrder[b.priority] ?? 99; break;
        case 'start_date': va = a.start_date ? new Date(a.start_date).getTime() : 0; vb = b.start_date ? new Date(b.start_date).getTime() : 0; break;
        default: va = a.created_at ? new Date(a.created_at).getTime() : 0; vb = b.created_at ? new Date(b.created_at).getTime() : 0; break;
      }
      const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
      return this.sortDir === 'asc' ? cmp : -cmp;
    });
    this.filteredProjects = list;
    this.cdr.detectChanges();
  }

  toggleSortDir(): void {
    this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  clearFilters(): void {
    this.filterOwner = ''; this.filterPriority = ''; this.filterStatus = '';
    this.sortField = 'created_at'; this.sortDir = 'desc';
    this.applyFilters();
  }

  open(id: number): void { this.router.navigate(['/projects', id]); }

  getProgress(p: any): number {
    const total = parseInt(p.total_tasks) || 0;
    const done = parseInt(p.completed_tasks) || 0;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }

  getStatusClass(s: string): string {
    const m: any = { active: 'badge-open', on_hold: 'badge-on_hold', completed: 'badge-resolved', cancelled: 'badge-closed', planning: 'badge-in_progress' };
    return m[s] || '';
  }
}
