import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

@Component({
  standalone: false,
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit {
  tasks: any[] = [];
  loading = false;
  filters = { status: '', priority: '', category: '', search: '' };

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    public auth: AuthService
  , private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['status']) this.filters.status = params['status'];
      this.loadTasks();
    });
  }

  loadTasks(): void {
    this.loading = true;
    const params: any = {};
    if (this.filters.status) params['status'] = this.filters.status;
    if (this.filters.priority) params['priority'] = this.filters.priority;
    if (this.filters.category) params['category'] = this.filters.category;
    if (this.filters.search) params['search'] = this.filters.search;
    this.http.get<any[]>('/api/tasks', { params }).subscribe({
      next: data => { this.tasks = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => this.loading = false
    });
  }

  togglePin(task: any, event: Event): void {
    event.stopPropagation();
    this.http.patch(`/api/tasks/${task.id}/pin`, {}).subscribe({
      next: (r: any) => { task.is_pinned = r.is_pinned; this.loadTasks(); this.cdr.detectChanges(); }
    });
  }

  openTask(id: number): void { this.router.navigate(['/tasks', id]); }
  newTask(): void { this.router.navigate(['/tasks/new']); }

  getStatusClass(s: string): string {
    const map: any = { open: 'badge-open', in_progress: 'badge-in_progress', on_hold: 'badge-on_hold', resolved: 'badge-resolved', closed: 'badge-closed' };
    return map[s] || '';
  }

  getPriorityClass(p: string): string { return 'badge-' + p; }

  formatDate(d: string): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }

  isOverdue(d: string, status: string): boolean {
    return d ? (new Date(d) < new Date() && !['resolved', 'closed'].includes(status)) : false;
  }

  clearFilters(): void {
    this.filters = { status: '', priority: '', category: '', search: '' };
    this.loadTasks();
  }
}
