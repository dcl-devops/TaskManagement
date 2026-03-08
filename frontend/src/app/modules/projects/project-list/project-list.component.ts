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
    <input type="text" [(ngModel)]="search" (input)="load()" placeholder="Search projects..." style="height:36px;width:220px;" />
    <select [(ngModel)]="statusFilter" (change)="load()" style="height:36px;width:140px;">
      <option value="">All Status</option>
      <option value="planning">Planning</option>
      <option value="active">Active</option>
      <option value="on_hold">On Hold</option>
      <option value="completed">Completed</option>
      <option value="cancelled">Cancelled</option>
    </select>
    <button class="btn btn-primary" routerLink="/projects/new" data-testid="new-project-btn">+ New Project</button>
  </div>
</div>
<div *ngIf="loading" class="loading-overlay"><div class="spinner"></div></div>
<div class="projects-grid" *ngIf="!loading">
  <div class="project-card card" *ngFor="let p of projects" (click)="open(p.id)" style="cursor:pointer;" data-testid="project-card">
    <div class="project-header">
      <div>
        <span class="project-num">{{ p.project_number }}</span>
        <span class="badge" [class]="getPriorityClass(p.priority)" style="margin-left:.5rem;">{{ p.priority | formatLabel }}</span>
      </div>
      <span class="badge" [class]="getStatusClass(p.status)">{{ p.status | formatLabel }}</span>
    </div>
    <h3 class="project-title">{{ p.title }}</h3>
    <div class="project-meta text-sm text-muted">
      <span>Owner: {{ p.owner_name }}</span>
      <span *ngIf="p.end_date">Due: {{ formatDate(p.end_date) }}</span>
    </div>
    <div class="progress-wrap">
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" [style.width.%]="getProgress(p)"></div>
      </div>
      <span class="progress-text text-sm">{{ getProgress(p) }}%</span>
    </div>
    <div class="project-footer text-xs text-muted">
      {{ p.total_tasks }} tasks &bull; {{ p.completed_tasks }} completed &bull; {{ p.overdue_tasks }} overdue
    </div>
  </div>
  <div class="empty-state" *ngIf="projects.length === 0">
    <div class="empty-icon">&#9650;</div>
    <h3>No projects found</h3><p>Start a new project</p>
  </div>
</div>`,
  styleUrls: ['./project-list.component.scss']
})
export class ProjectListComponent implements OnInit {
  projects: any[] = [];
  loading = false;
  search = '';
  statusFilter = '';
  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}
  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true;
    const params: any = {};
    if (this.search) params['search'] = this.search;
    if (this.statusFilter) params['status'] = this.statusFilter;
    this.http.get<any[]>('/api/projects', { params }).subscribe({ next: r => { this.projects = r; this.loading = false; this.cdr.detectChanges(); }, error: () => this.loading = false });
  }
  open(id: number): void { this.router.navigate(['/projects', id]); }
  getProgress(p: any): number { return p.total_tasks > 0 ? Math.round((p.completed_tasks / p.total_tasks) * 100) : 0; }
  formatDate(d: string): string { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'; }
  getPriorityClass(p: string): string { return 'badge-' + p; }
  getStatusClass(s: string): string { const m: any = { planning: 'badge-on_hold', active: 'badge-open', on_hold: 'badge-on_hold', completed: 'badge-resolved', cancelled: 'badge-closed' }; return m[s] || ''; }
}
