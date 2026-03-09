import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../core/toast.service';
import { AuthService } from '../../../core/auth.service';

@Component({
  standalone: false,
  selector: 'app-project-detail',
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss']
})
export class ProjectDetailComponent implements OnInit {
  project: any = null;
  tasks: any[] = [];
  updates: any[] = [];
  loading = true;
  activeTab = 'tasks';
  newRemark = '';
  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router, private toast: ToastService, public auth: AuthService, private cdr: ChangeDetectorRef) {}
  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.http.get<any>(`/api/projects/${id}`).subscribe({
      next: p => { this.project = p; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
    this.http.get<any[]>(`/api/projects/${id}/updates`).subscribe({
      next: r => { this.updates = r; this.cdr.detectChanges(); },
      error: () => {}
    });
    this.http.get<any[]>('/api/tasks', { params: { project_id: String(id) } }).subscribe({
      next: r => { this.tasks = r; this.cdr.detectChanges(); },
      error: () => {}
    });
  }
  get projId(): number { return this.route.snapshot.params['id']; }
  addUpdate(): void {
    if (!this.newRemark.trim()) return;
    this.http.post<any>(`/api/projects/${this.projId}/updates`, { remark: this.newRemark }).subscribe({ next: r => { this.updates.unshift(r); this.newRemark = ''; this.cdr.detectChanges(); } });
  }
  getProgress(): number { return this.project?.total_tasks > 0 ? Math.round((this.project.completed_tasks / this.project.total_tasks) * 100) : 0; }
  formatDate(d: string): string { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'; }
  getStatusClass(s: string): string { const m: any = { planning: 'badge-on_hold', active: 'badge-open', on_hold: 'badge-on_hold', completed: 'badge-resolved', cancelled: 'badge-closed' }; return m[s] || ''; }
  getPriorityClass(p: string): string { return 'badge-' + p; }
  getInitials(n: string): string { return (n || '').split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2); }
}
