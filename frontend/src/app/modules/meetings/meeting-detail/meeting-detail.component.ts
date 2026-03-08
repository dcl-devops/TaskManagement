import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../core/toast.service';
import { AuthService } from '../../../core/auth.service';

@Component({
  standalone: false,
  selector: 'app-meeting-detail',
  templateUrl: './meeting-detail.component.html',
  styleUrls: ['./meeting-detail.component.scss']
})
export class MeetingDetailComponent implements OnInit {
  meeting: any = null;
  tasks: any[] = [];
  updates: any[] = [];
  moms: any[] = [];
  loading = true;
  activeTab = 'updates';
  newRemark = '';
  newMom = '';

  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router, private toast: ToastService, public auth: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.http.get<any>(`/api/meetings/${id}`).subscribe({ next: m => { this.meeting = m; this.loading = false; this.cdr.detectChanges(); } });
    this.http.get<any[]>(`/api/meetings/${id}/updates`).subscribe({ next: r => { this.updates = r; this.cdr.detectChanges(); } });
    this.http.get<any[]>(`/api/meetings/${id}/mom`).subscribe({ next: r => { this.moms = r; this.cdr.detectChanges(); } });
    this.http.get<any[]>('/api/tasks', { params: { meeting_id: String(id) } }).subscribe({ next: r => { this.tasks = r; this.cdr.detectChanges(); } });
  }

  get meetingId(): number { return this.route.snapshot.params['id']; }

  addUpdate(): void {
    if (!this.newRemark.trim()) return;
    this.http.post<any>(`/api/meetings/${this.meetingId}/updates`, { remark: this.newRemark }).subscribe({
      next: r => { this.updates.unshift(r); this.newRemark = ''; this.toast.success('Update added'); }
    });
  }

  addMom(): void {
    if (!this.newMom.trim()) return;
    this.http.post<any>(`/api/meetings/${this.meetingId}/mom`, { content: this.newMom }).subscribe({
      next: r => { this.moms.unshift(r); this.newMom = ''; this.toast.success('MOM added'); }
    });
  }

  formatDate(d: string): string { return d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'; }
  getInitials(name: string): string { return (name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2); }
  getStatusClass(s: string): string {
    const m: any = { open: 'badge-open', in_progress: 'badge-in_progress', recurring: 'badge-resolved', closed: 'badge-closed' };
    return m[s] || '';
  }
  getPriorityClass(p: string): string { return 'badge-' + p; }
}
