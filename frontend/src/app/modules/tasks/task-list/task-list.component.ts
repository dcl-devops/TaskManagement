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
  displayTasks: any[] = [];
  groupedTasks: { task: any; subtasks: any[] }[] = [];
  loading = false;
  groupSubtasks = false;
  filters: any = { status: '', priority: '', category: '', search: '', assigned_to: '', meeting_id: '', project_id: '', customer_id: '' };
  sortCol = '';
  sortDir: 'asc' | 'desc' = 'asc';
  users: any[] = [];
  meetings: any[] = [];
  projects: any[] = [];
  customers: any[] = [];
  private priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  private statusOrder: Record<string, number> = { open: 0, in_progress: 1, on_hold: 2, resolved: 3, closed: 4 };

  constructor(
    private http: HttpClient, private router: Router,
    private route: ActivatedRoute, public auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Restore sort from localStorage
    const saved = localStorage.getItem('task_sort');
    if (saved) {
      const s = JSON.parse(saved);
      this.sortCol = s.col || '';
      this.sortDir = s.dir || 'asc';
    }
    this.groupSubtasks = localStorage.getItem('task_group_subtasks') === 'true';
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
    this.http.get<any[]>('/api/customers').subscribe({ next: r => { this.customers = r; this.cdr.detectChanges(); } });
  }

  loadTasks(): void {
    this.loading = true;
    const params: any = {};
    Object.keys(this.filters).forEach(k => { if (this.filters[k]) params[k] = this.filters[k]; });
    this.http.get<any[]>('/api/tasks', { params }).subscribe({
      next: data => {
        this.tasks = data;
        this.applySort();
        this.buildDisplay();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  buildDisplay(): void {
    this.displayTasks = [...this.tasks];
    if (this.groupSubtasks) {
      const parentMap = new Map<number, any[]>();
      const allTaskIds = new Set(this.tasks.map(t => t.id));
      const subtasks = this.tasks.filter(t => t.parent_task_id);
      const topLevel = this.tasks.filter(t => !t.parent_task_id);
      subtasks.forEach(s => {
        if (!parentMap.has(s.parent_task_id)) parentMap.set(s.parent_task_id, []);
        parentMap.get(s.parent_task_id)!.push(s);
      });
      // For search results: if a subtask matches but its parent doesn't, still show the subtask
      // under a "virtual" parent group
      const orphanSubtasks = subtasks.filter(s => !allTaskIds.has(s.parent_task_id));
      this.groupedTasks = [
        ...topLevel.map(t => ({
          task: t,
          subtasks: parentMap.get(t.id) || []
        })),
        ...orphanSubtasks.map(s => ({
          task: s,
          subtasks: [] as any[]
        }))
      ];
    }
  }

  onGroupToggle(): void {
    localStorage.setItem('task_group_subtasks', String(this.groupSubtasks));
    this.buildDisplay();
    this.cdr.detectChanges();
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
    localStorage.setItem('task_sort', JSON.stringify({ col: this.sortCol, dir: this.sortDir }));
    this.applySort();
    this.buildDisplay();
    this.cdr.detectChanges();
  }

  applySort(): void {
    if (!this.sortCol) return;
    this.tasks.sort((a, b) => {
      let va = this.getSortValue(a, this.sortCol);
      let vb = this.getSortValue(b, this.sortCol);
      let cmp = 0;
      if (typeof va === 'number' && typeof vb === 'number') { cmp = va - vb; }
      else { cmp = String(va || '').localeCompare(String(vb || '')); }
      return this.sortDir === 'asc' ? cmp : -cmp;
    });
  }

  private getSortValue(task: any, col: string): any {
    switch (col) {
      case 'task_number': return task.task_number || '';
      case 'title': return task.title || '';
      case 'category': return task.category || '';
      case 'assigned_to': return task.assigned_to_name || '';
      case 'priority': return this.priorityOrder[task.priority] ?? 99;
      case 'status': return this.statusOrder[task.status] ?? 99;
      case 'due_date': return task.due_date ? new Date(task.due_date).getTime() : Infinity;
      default: return '';
    }
  }

  getSortIcon(col: string): string {
    if (this.sortCol !== col) return '⇅';
    return this.sortDir === 'asc' ? '↑' : '↓';
  }

  getOverdueDays(task: any): number {
    if (!task.due_date || ['resolved', 'closed'].includes(task.status)) return 0;
    const diff = Math.floor((Date.now() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
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
    this.filters = { status: '', priority: '', category: '', search: '', assigned_to: '', meeting_id: '', project_id: '', customer_id: '' };
    this.loadTasks();
  }
}
