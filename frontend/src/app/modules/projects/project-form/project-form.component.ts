import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastService } from '../../../core/toast.service';

@Component({
  standalone: false,
  selector: 'app-project-form',
  template: `
<div class="page-header">
  <h1>{{ editId ? 'Edit Project' : 'New Project' }}</h1>
  <div class="header-actions">
    <button class="btn btn-secondary" routerLink="/projects">Cancel</button>
    <button class="btn btn-primary" (click)="save()" [disabled]="saving" data-testid="save-project-btn">{{ saving ? 'Saving...' : (editId ? 'Update' : 'Create Project') }}</button>
  </div>
</div>
<form [formGroup]="form" style="display:grid;grid-template-columns:1fr 300px;gap:1.5rem;align-items:start;">
  <div class="card">
    <div style="padding:1.25rem;display:flex;flex-direction:column;gap:1rem;">
      <div class="form-group"><label>Title *</label><input formControlName="title" data-testid="proj-title" /></div>
      <div class="form-group"><label>Description</label><textarea formControlName="description" rows="5"></textarea></div>
      <div style="margin-top:.5rem;">
        <label style="display:block;margin-bottom:.5rem;font-size:.8125rem;font-weight:500;color:var(--text-secondary);">Members</label>
        <div style="display:flex;flex-wrap:wrap;gap:.5rem;">
          <div *ngFor="let u of users" (click)="toggleMember(u)" style="cursor:pointer;padding:.375rem .75rem;border-radius:999px;font-size:.8125rem;border:1px solid var(--border-color);" [style.background]="isMember(u.id) ? 'var(--accent-indigo-light)' : 'var(--bg-tertiary)'" [style.color]="isMember(u.id) ? 'var(--accent-indigo)' : 'inherit'">{{ u.name }}</div>
        </div>
      </div>
    </div>
  </div>
  <div class="card">
    <div style="padding:.75rem 1.25rem;font-size:.875rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border-color);">Details</div>
    <div style="padding:1.25rem;display:flex;flex-direction:column;gap:1rem;">
      <div class="form-group"><label>Owner *</label><select formControlName="owner_id"><option [value]="null">Select</option><option *ngFor="let u of users" [value]="u.id">{{ u.name }}</option></select></div>
      <div class="form-group"><label>Department</label><select formControlName="department_id"><option [value]="null">Select</option><option *ngFor="let d of departments" [value]="d.id">{{ d.name }}</option></select></div>
      <div class="form-group"><label>Location</label><select formControlName="location_id"><option [value]="null">Select</option><option *ngFor="let l of locations" [value]="l.id">{{ l.name }}</option></select></div>
      <div class="form-group"><label>Start Date</label><input type="date" formControlName="start_date" /></div>
      <div class="form-group"><label>End Date</label><input type="date" formControlName="end_date" /></div>
      <div class="form-group"><label>Priority</label><select formControlName="priority"><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
      <div class="form-group"><label>Status</label><select formControlName="status"><option value="planning">Planning</option><option value="active">Active</option><option value="on_hold">On Hold</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
    </div>
  </div>
</form>`
})
export class ProjectFormComponent implements OnInit {
  form: FormGroup;
  users: any[] = [];
  departments: any[] = [];
  locations: any[] = [];
  saving = false;
  editId: number | null = null;
  selectedMembers: any[] = [];
  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router, private route: ActivatedRoute, private toast: ToastService, private cdr: ChangeDetectorRef) {
    this.form = this.fb.group({ title: ['', Validators.required], description: [''], owner_id: [null, Validators.required], department_id: [null], location_id: [null], start_date: [''], end_date: [''], priority: ['medium'], status: ['active'] });
  }
  ngOnInit(): void {
    this.editId = this.route.snapshot.params['id'] ? parseInt(this.route.snapshot.params['id']) : null;
    this.http.get<any>('/api/admin/users').subscribe({ next: r => { this.users = r.users || r; this.cdr.detectChanges(); } });
    this.http.get<any[]>('/api/admin/departments').subscribe({ next: r => { this.departments = r; this.cdr.detectChanges(); } });
    this.http.get<any[]>('/api/admin/locations').subscribe({ next: r => { this.locations = r; this.cdr.detectChanges(); } });
    if (this.editId) {
      this.http.get<any>(`/api/projects/${this.editId}`).subscribe({ next: p => { this.form.patchValue(p); this.selectedMembers = p.members || []; } });
    }
  }
  toggleMember(u: any): void {
    const i = this.selectedMembers.findIndex(m => m.user_id === u.id);
    if (i >= 0) this.selectedMembers.splice(i, 1); else this.selectedMembers.push({ user_id: u.id });
  }
  isMember(id: number): boolean { return this.selectedMembers.some(m => m.user_id === id); }
  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const payload = { ...this.form.value, member_ids: this.selectedMembers.map(m => m.user_id) };
    const req = this.editId ? this.http.put<any>(`/api/projects/${this.editId}`, payload) : this.http.post<any>('/api/projects', payload);
    req.subscribe({ next: r => { this.toast.success('Project saved'); this.router.navigate(['/projects', r.id]); }, error: (e) => { this.toast.error(e.error?.message || 'Save failed'); this.saving = false; this.cdr.detectChanges(); } });
  }
}
