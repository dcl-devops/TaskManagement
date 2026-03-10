import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ChartConfiguration } from 'chart.js';

@Component({
  standalone: false,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats: any = {};
  loading = true;
  selectedYear: number = new Date().getFullYear();
  yearOptions: number[] = [];
  Math = Math;

  taskChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  taskChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } }, x: { grid: { display: false } } }
  };

  meetingChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  meetingChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } }, x: { grid: { display: false } } }
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    public auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 3; y <= currentYear + 1; y++) this.yearOptions.push(y);
  }

  ngOnInit(): void { this.loadDashboard(); }

  loadDashboard(): void {
    this.loading = true;
    this.http.get<any>('/api/dashboard/stats', { params: { year: String(this.selectedYear) } }).subscribe({
      next: d => {
        this.stats = d;
        this.buildCharts(d);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  onYearChange(): void { this.loadDashboard(); }

  buildCharts(d: any): void {
    const labels = d.task_trend?.labels || [];
    this.taskChartData = {
      labels,
      datasets: [
        { data: d.task_trend?.created || [], label: 'Tasks Added', borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.3, pointRadius: 3 },
        { data: d.task_trend?.completed || [], label: 'Tasks Completed', borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.3, pointRadius: 3 }
      ]
    };
    this.meetingChartData = {
      labels,
      datasets: [
        { data: d.meeting_trend?.count || [], label: 'Meetings', borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.1)', fill: true, tension: 0.3, pointRadius: 3 }
      ]
    };
  }

  goToTasks(params?: any): void { this.router.navigate(['/tasks'], { queryParams: params }); }
  openTask(id: number): void { this.router.navigate(['/tasks', id]); }
  formatDate(d: string): string { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'; }
  formatTime(d: string): string { return d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''; }
  isOverdue(d: string): boolean { return d ? new Date(d) < new Date() : false; }
  getStatusClass(s: string): string {
    const m: any = { open: 'badge-open', in_progress: 'badge-in_progress', on_hold: 'badge-on_hold', resolved: 'badge-resolved', closed: 'badge-closed' };
    return m[s] || '';
  }
  getPriorityClass(p: string): string { return 'badge-' + p; }
}
