import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';

type ReportType = 'overdue-tasks' | 'task-aging' | 'user-productivity' | 'department-performance' | 'project-progress';

@Component({
  standalone: false,
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  activeReport: ReportType = 'overdue-tasks';
  data: any[] = [];
  loading = false;
  protected readonly Math = Math;
  reports: { key: ReportType; label: string }[] = [
    { key: 'overdue-tasks', label: 'Overdue Tasks' },
    { key: 'task-aging', label: 'Task Aging' },
    { key: 'user-productivity', label: 'User Productivity' },
    { key: 'department-performance', label: 'Department Performance' },
    { key: 'project-progress', label: 'Project Progress' }
  ];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.loadReport(); }

  loadReport(): void {
    this.loading = true;
    this.data = [];
    this.http.get<any[]>(`/api/reports/${this.activeReport}`).subscribe({
      next: r => { this.data = r; this.loading = false; this.cdr.detectChanges(); },
      error: () => this.loading = false
    });
  }

  selectReport(key: ReportType): void { this.activeReport = key; this.loadReport(); }

  getPriorityClass(p: string): string { return 'badge-' + p; }
  getStatusClass(s: string): string {
    const m: any = { open: 'badge-open', in_progress: 'badge-in_progress', on_hold: 'badge-on_hold', resolved: 'badge-resolved', closed: 'badge-closed' };
    return m[s] || '';
  }
  formatDate(d: string): string { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'; }
}
