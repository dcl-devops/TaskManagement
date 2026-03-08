import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-meeting-list',
  template: `
<div class="page-header">
  <h1>Meetings</h1>
  <div class="header-actions">
    <input type="text" [(ngModel)]="search" (input)="load()" placeholder="Search meetings..." style="height:36px;width:220px;" />
    <select [(ngModel)]="statusFilter" (change)="load()" style="height:36px;width:140px;">
      <option value="">All Status</option>
      <option value="open">Open</option>
      <option value="in_progress">In Progress</option>
      <option value="recurring">Recurring</option>
      <option value="closed">Closed</option>
    </select>
    <button class="btn btn-primary" routerLink="/meetings/new" data-testid="new-meeting-btn">+ New Meeting</button>
  </div>
</div>
<div *ngIf="loading" class="loading-overlay"><div class="spinner"></div></div>
<div class="meetings-grid" *ngIf="!loading">
  <div class="meeting-card card" *ngFor="let m of meetings" (click)="open(m.id)" data-testid="meeting-card" style="cursor:pointer;">
    <div class="meeting-card-header">
      <span class="meeting-num">{{ m.meeting_number }}</span>
      <span class="badge" [class]="'badge-' + m.status">{{ m.status | formatLabel }}</span>
    </div>
    <h3 class="meeting-title">{{ m.title }}</h3>
    <div *ngIf="m.project_title" style="margin-bottom:.5rem;"><span class="badge" style="background:var(--accent-blue-light,#dbeafe);color:var(--accent-blue,#2563eb);font-size:.6875rem;">{{ m.project_title }}</span></div>
    <div class="meeting-meta">
      <span class="text-sm text-muted">Owner: {{ m.owner_name || '-' }}</span>
      <span class="text-sm text-muted" *ngIf="m.meeting_date">{{ formatDate(m.meeting_date) }}</span>
    </div>
    <div class="meeting-footer">
      <span class="text-xs text-muted">{{ m.task_count }} tasks &bull; {{ m.member_count }} members</span>
    </div>
  </div>
  <div class="empty-state" *ngIf="meetings.length === 0">
    <div class="empty-icon">&#9642;</div>
    <h3>No meetings found</h3>
    <p>Create your first meeting</p>
  </div>
</div>`,
  styleUrls: ['./meeting-list.component.scss']
})
export class MeetingListComponent implements OnInit {
  meetings: any[] = [];
  loading = false;
  search = '';
  statusFilter = '';
  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}
  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true;
    const params: any = {};
    if (this.search) params['search'] = this.search;
    if (this.statusFilter) params['status'] = this.statusFilter;
    this.http.get<any[]>('/api/meetings', { params }).subscribe({ next: r => { this.meetings = r; this.loading = false; this.cdr.detectChanges(); }, error: () => this.loading = false });
  }
  open(id: number): void { this.router.navigate(['/meetings', id]); }
  formatDate(d: string): string { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
}
