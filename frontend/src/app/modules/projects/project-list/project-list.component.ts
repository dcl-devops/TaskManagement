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
        <span class="text-sm text-muted">{{ projects.length }} projects</span>
        <button class="btn btn-primary" routerLink="/projects/new" data-testid="new-project-btn">+ New Project</button>
      </div>
    </div>
    <div *ngIf="loading" class="loading-overlay"><div class="spinner"></div></div>
    <div class="project-grid" *ngIf="!loading">
      <div class="card project-card" *ngFor="let p of projects" (click)="open(p.id)" [attr.data-testid]="'project-' + p.id">
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
      <div *ngIf="projects.length === 0" class="empty-state">
        <div class="empty-icon">&#9650;</div>
        <h3>No projects yet</h3>
        <p>Create your first project to get started</p>
      </div>
    </div>
  `,
  styles: [`
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
  loading = true;

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    const params: any = {};
    this.http.get<any[]>('/api/projects', { params }).subscribe({
      next: r => { this.projects = r; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  open(id: number): void { this.router.navigate(['/projects', id]); }

  getProgress(p: any): number {
    const total = parseInt(p.total_tasks) || 0;
    const done = parseInt(p.completed_tasks) || 0;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }

  getStatusClass(s: string): string {
    const m: any = { active: 'badge-open', on_hold: 'badge-on_hold', completed: 'badge-resolved', cancelled: 'badge-closed' };
    return m[s] || '';
  }
}
