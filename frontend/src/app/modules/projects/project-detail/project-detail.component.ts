import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../core/toast.service';

@Component({
  standalone: false,
  selector: 'app-project-detail',
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss']
})
export class ProjectDetailComponent implements OnInit {
  project: any = null;
  updates: any[] = [];
  loading = true;
  activeTab: 'updates' | 'meetings' | 'tasks' = 'updates';
  newUpdate = '';

  constructor(
    private http: HttpClient, private route: ActivatedRoute,
    private router: Router, private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

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
  }

  postUpdate(): void {
    if (!this.newUpdate.trim()) return;
    const id = this.route.snapshot.params['id'];
    this.http.post<any>(`/api/projects/${id}/updates`, { remark: this.newUpdate }).subscribe({
      next: r => { this.updates.unshift(r); this.newUpdate = ''; this.toast.success('Update posted'); this.cdr.detectChanges(); },
      error: () => { this.toast.error('Failed to post update'); }
    });
  }

  getStatusClass(s: string): string {
    const m: any = { open: 'badge-open', in_progress: 'badge-in_progress', on_hold: 'badge-on_hold', resolved: 'badge-resolved', closed: 'badge-closed', active: 'badge-open', completed: 'badge-resolved', cancelled: 'badge-closed' };
    return m[s] || '';
  }

  getPriorityClass(p: string): string { return 'badge-' + p; }

  formatDate(d: string): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getInitials(name: string): string {
    return (name || '').split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2);
  }
}
