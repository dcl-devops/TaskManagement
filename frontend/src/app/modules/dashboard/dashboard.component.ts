import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  standalone: false,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats: any = {};
  teamWorkload: any[] = [];
  loading = true;
  protected readonly Math = Math;

  constructor(private http: HttpClient, public auth: AuthService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.http.get<any>('/api/dashboard/stats').subscribe({
      next: data => { this.stats = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
    if (this.auth.isManagerOrAbove()) {
      this.http.get<any[]>('/api/dashboard/team-workload').subscribe({
        next: data => { this.teamWorkload = data; this.cdr.detectChanges(); },
        error: () => {}
      });
    }
  }

  goToTasks(filter: any = {}): void {
    this.router.navigate(['/tasks'], { queryParams: filter });
  }

  getStatusClass(status: string): string {
    const map: any = { open: 'badge-open', in_progress: 'badge-in_progress', on_hold: 'badge-on_hold', resolved: 'badge-resolved', closed: 'badge-closed' };
    return map[status] || 'badge-open';
  }

  getPriorityClass(p: string): string {
    return 'badge-' + p;
  }

  formatDate(d: string): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  isOverdue(d: string): boolean {
    return d ? new Date(d) < new Date() : false;
  }
}
