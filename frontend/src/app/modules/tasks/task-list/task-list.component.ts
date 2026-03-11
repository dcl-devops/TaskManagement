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

  // Raw dropdown data (full lists)
  allUsers: any[] = [];
  allMeetings: any[] = [];
  allProjects: any[] = [];
  allCustomers: any[] = [];

  // Filtered dropdown options (based on other filter selections)
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
    const saved = localStorage.getItem('task_sort');
    if (saved) { const s = JSON.parse(saved); this.sortCol = s.col || ''; this.sortDir = s.dir || 'asc'; }
    this.groupSubtasks = localStorage.getItem('task_group_subtasks') === 'true';
    this.loadDropdowns();
    this.route.queryParams.subscribe(params => {
      if (params['status']) this.filters.status = params['status'];
      this.loadTasks();
    });
  }

  loadDropdowns(): void {
    this.http.get<any>('/api/admin/users').subscribe({ next: r => { this.allUsers = r.users || r; this.updateFilteredDropdowns(); this.cdr.detectChanges(); } });
    this.http.get<any[]>('/api/meetings').subscribe({ next: r => { this.allMeetings = r; this.updateFilteredDropdowns(); this.cdr.detectChanges(); } });
    this.http.get<any[]>('/api/projects').subscribe({ next: r => { this.allProjects = r; this.updateFilteredDropdowns(); this.cdr.detectChanges(); } });
    this.http.get<any[]>('/api/customers').subscribe({ next: r => { this.allCustomers = r; this.updateFilteredDropdowns(); this.cdr.detectChanges(); } });
  }

  onFilterChange(): void {
    this.updateFilteredDropdowns();
    this.loadTasks();
  }

  updateFilteredDropdowns(): void {
    let filteredProjects = [...this.allProjects];
    let filteredMeetings = [...this.allMeetings];
    let filteredCustomers = [...this.allCustomers];

    // If customer is selected, filter projects and meetings by that customer
    if (this.filters.customer_id) {
      const custId = String(this.filters.customer_id);
      filteredProjects = filteredProjects.filter(p => String(p.customer_id) === custId);
      const projectIds = new Set(filteredProjects.map(p => p.id));
      filteredMeetings = filteredMeetings.filter(m => projectIds.has(m.project_id));
    }

    // If project is selected, filter meetings by that project and narrow customers
    if (this.filters.project_id) {
      const projId = parseInt(this.filters.project_id);
      filteredMeetings = filteredMeetings.filter(m => m.project_id === projId);
      const proj = this.allProjects.find(p => p.id === projId);
      if (proj?.customer_id) {
        filteredCustomers = filteredCustomers.filter(c => c.id === proj.customer_id);
      }
    }

    // If meeting is selected, narrow projects and customers
    if (this.filters.meeting_id) {
      const meetId = parseInt(this.filters.meeting_id);
      const meet = this.allMeetings.find(m => m.id === meetId);
      if (meet?.project_id) {
        filteredProjects = filteredProjects.filter(p => p.id === meet.project_id);
        const proj = this.allProjects.find(p => p.id === meet.project_id);
        if (proj?.customer_id) {
          filteredCustomers = filteredCustomers.filter(c => c.id === proj.customer_id);
        }
      }
    }

    // Filter users based on current task data (assigned users)
    this.users = this.allUsers;
    this.projects = filteredProjects;
    this.meetings = filteredMeetings;
    this.customers = filteredCustomers;
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
      const orphanSubtasks = subtasks.filter(s => !allTaskIds.has(s.parent_task_id));
      this.groupedTasks = [
        ...topLevel.map(t => ({ task: t, subtasks: parentMap.get(t.id) || [] })),
        ...orphanSubtasks.map(s => ({ task: s, subtasks: [] as any[] }))
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
    if (this.sortCol === col) { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; }
    else { this.sortCol = col; this.sortDir = 'asc'; }
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
    this.updateFilteredDropdowns();
    this.loadTasks();
  }
}
