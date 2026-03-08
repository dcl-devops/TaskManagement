import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../core/toast.service';
import { AuthService } from '../../../core/auth.service';

@Component({
  standalone: false,
  selector: 'app-task-detail',
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.scss']
})
export class TaskDetailComponent implements OnInit {
  task: any = null;
  comments: any[] = [];
  attachments: any[] = [];
  activities: any[] = [];
  subtasks: any[] = [];
  loading = true;
  activeTab = 'comments';
  newComment = '';
  savingComment = false;
  uploadingFile = false;
  statusOptions = ['open', 'in_progress', 'on_hold', 'resolved', 'closed'];
  showStatusMenu = false;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService,
    public auth: AuthService
  , private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadTask(id);
    this.loadComments(id);
    this.loadAttachments(id);
    this.loadActivities(id);
    this.loadSubtasks(id);
  }

  get taskId(): number { return this.route.snapshot.params['id']; }

  loadTask(id?: number): void {
    const tid = id || this.taskId;
    this.http.get<any>(`/api/tasks/${tid}`).subscribe({
      next: t => { this.task = t; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.router.navigate(['/tasks']); }
    });
  }

  loadComments(id?: number): void {
    this.http.get<any[]>(`/api/tasks/${id || this.taskId}/comments`).subscribe({ next: r => { this.comments = r; this.cdr.detectChanges(); } });
  }

  loadAttachments(id?: number): void {
    this.http.get<any[]>(`/api/tasks/${id || this.taskId}/attachments`).subscribe({ next: r => { this.attachments = r; this.cdr.detectChanges(); } });
  }

  loadActivities(id?: number): void {
    this.http.get<any[]>(`/api/tasks/${id || this.taskId}/activities`).subscribe({ next: r => { this.activities = r; this.cdr.detectChanges(); } });
  }

  loadSubtasks(id?: number): void {
    this.http.get<any[]>('/api/tasks', { params: { parent_task_id: String(id || this.taskId) } }).subscribe({ next: r => { this.subtasks = r; this.cdr.detectChanges(); } });
  }

  addComment(): void {
    if (!this.newComment.trim()) return;
    this.savingComment = true;
    this.http.post<any>(`/api/tasks/${this.taskId}/comments`, { comment: this.newComment }).subscribe({
      next: c => { this.comments.push(c); this.newComment = ''; this.savingComment = false; this.cdr.detectChanges(); },
      error: () => this.savingComment = false
    });
  }

  uploadFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);
    this.uploadingFile = true;
    this.http.post<any>(`/api/tasks/${this.taskId}/attachments`, formData).subscribe({
      next: a => { this.attachments.unshift(a); this.toast.success('File uploaded'); this.uploadingFile = false; this.cdr.detectChanges(); },
      error: (err) => { this.toast.error(err.error?.message || 'Upload failed'); this.uploadingFile = false; }
    });
  }

  changeStatus(status: string): void {
    this.showStatusMenu = false;
    if (!this.task) return;
    const payload = { ...this.task, status };
    this.http.put<any>(`/api/tasks/${this.taskId}`, payload).subscribe({
      next: t => { this.task = t; this.loadActivities(); this.toast.success('Status updated'); this.cdr.detectChanges(); }
    });
  }

  editTask(): void { this.router.navigate(['/tasks', this.taskId, 'edit']); }

  getStatusClass(s: string): string {
    const map: any = { open: 'badge-open', in_progress: 'badge-in_progress', on_hold: 'badge-on_hold', resolved: 'badge-resolved', closed: 'badge-closed' };
    return map[s] || '';
  }

  getPriorityClass(p: string): string { return 'badge-' + p; }

  formatDate(d: string): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatDateTime(d: string): string {
    if (!d) return '-';
    return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  getInitials(name: string): string {
    return (name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  isOverdue(): boolean {
    return this.task?.due_date ? new Date(this.task.due_date) < new Date() && !['resolved', 'closed'].includes(this.task.status) : false;
  }
}
