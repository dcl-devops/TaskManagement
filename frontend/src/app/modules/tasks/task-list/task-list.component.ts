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
  filters: any = { status: '', priority: '', category: '', search: '', assigned_to: '', assigned_by: '', meeting_id: '', project_id: '' };
  sortCol = '';
  sortDir: 'asc' | 'desc' = 'asc';
  users: any[] = [];
  meetings: any[] = [];
  projects: any[] = [];
  private priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  private statusOrder: Record<string, number> = { open: 0, in_progress: 1, on_hold: 2, resolved: 3, closed: 4 };

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    public auth: AuthService
  , private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadDropdowns();
    this.route.queryParams.subscribe(params => {
      if (params['status']) this.filters.status = params['status'];
      this.loadTasks();
    });
  }

  loadDropdowns(): void {
    this.http.get<any>('/api/admin/users').subscribe({ next: r => { this.users = r.users || r; this.cdr.detectChanges(); } });
    this.http.get<any[]>('/api/meetings').subscribe({ next: r => { this.meetings = r; this.cdr.detectChanges(); } });
    this.http.get<any[]>('/api/projects').subscribe({ next: r => { this.projects = r; this.cdr.detectChanges(); } });
  }

  loadTasks(): void {
    this.loading = true;
    const params: any = {};
    if (this.filters.status) params['status'] = this.filters.status;
    if (this.filters.priority) params['priority'] = this.filters.priority;
    if (this.filters.category) params['category'] = this.filters.category;
    if (this.filters.search) params['search'] = this.filters.search;
    if (this.filters.assigned_to) params['assigned_to'] = this.filters.assigned_to;
    if (this.filters.assigned_by) params['assigned_by'] = this.filters.assigned_by;
    if (this.filters.meeting_id) params['meeting_id'] = this.filters.meeting_id;
    if (this.filters.project_id) params['project_id'] = this.filters.project_id;
    this.http.get<any[]>('/api/tasks', { params }).subscribe({
      next: data => { this.tasks = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
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

  sortBy(col: string): void {
    if (this.sortCol === col) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortCol = col;
      this.sortDir = 'asc';
    }
    this.applySort();
    this.cdr.detectChanges();
  }

  applySort(): void {
    if (!this.sortCol) return;
    this.tasks.sort((a, b) => {
      let va = this.getSortValue(a, this.sortCol);
      let vb = this.getSortValue(b, this.sortCol);
      let cmp = 0;
      if (typeof va === 'number' && typeof vb === 'number') {
        cmp = va - vb;
      } else {
        cmp = String(va || '').localeCompare(String(vb || ''));
      }
      return this.sortDir === 'asc' ? cmp : -cmp;
    });
  }

  private getSortValue(task: any, col: string): any {
    switch (col) {
      case 'task_number': return task.task_number || '';
      case 'title': return task.title || '';
      case 'category': return task.category || '';
      case 'assigned_to': return task.assigned_to_name || '';
      case 'assigned_by': return task.assigned_by_name || '';
      case 'department': return task.department_name || '';
      case 'priority': return this.priorityOrder[task.priority] ?? 99;
      case 'status': return this.statusOrder[task.status] ?? 99;
      case 'due_date': return task.due_date ? new Date(task.due_date).getTime() : Infinity;
      case 'updated_at': return task.updated_at ? new Date(task.updated_at).getTime() : 0;
      default: return '';
    }
  }

  getSortIcon(col: string): string {
    if (this.sortCol !== col) return '⇅';
    return this.sortDir === 'asc' ? '↑' : '↓';
  }

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
    this.filters = { status: '', priority: '', category: '', search: '', assigned_to: '', assigned_by: '', meeting_id: '', project_id: '' };
    this.loadTasks();
  }
}
