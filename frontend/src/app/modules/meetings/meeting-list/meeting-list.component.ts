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
        <span class="text-sm text-muted">{{ meetings.length }} meetings</span>
        <button class="btn btn-primary" routerLink="/meetings/new" data-testid="new-meeting-btn">+ New Meeting</button>
      </div>
    </div>
    <div *ngIf="loading" class="loading-overlay"><div class="spinner"></div></div>
    <div class="meeting-grid" *ngIf="!loading">
      <div class="card meeting-card" *ngFor="let m of meetings" (click)="open(m.id)" [attr.data-testid]="'meeting-' + m.id">
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
      <div *ngIf="meetings.length === 0" class="empty-state">
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
  loading = true;

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.http.get<any[]>('/api/meetings').subscribe({
      next: r => { this.meetings = r; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
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
