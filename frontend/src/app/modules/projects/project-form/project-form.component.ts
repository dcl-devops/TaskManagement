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
      <div class="form-group">
        <label>Members</label>
        <div class="member-search-wrap">
          <input type="text" [(ngModel)]="memberSearch" [ngModelOptions]="{standalone: true}" placeholder="Type to search members..." class="member-search-input" data-testid="member-search" />
          <div class="member-search-results" *ngIf="memberSearch.length >= 1 && filteredUsers.length > 0">
            <div *ngFor="let u of filteredUsers" class="member-search-item" (click)="addMember(u)">
              <img *ngIf="u.avatar_url" [src]="u.avatar_url" class="avatar avatar-sm avatar-img" />
              <div class="avatar avatar-sm" *ngIf="!u.avatar_url">{{ u.name?.charAt(0) }}</div>
              <span class="text-sm">{{ u.name }}</span>
              <span class="text-xs text-muted">{{ u.email }}</span>
            </div>
          </div>
        </div>
        <div class="selected-members" *ngIf="selectedMembers.length > 0">
          <div *ngFor="let m of selectedMembers" class="member-chip">
            <span>{{ m.name }}</span>
            <button class="chip-remove" (click)="removeMember(m)">&times;</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="card">
    <div style="padding:.75rem 1.25rem;font-size:.875rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border-color);">Details</div>
    <div style="padding:1.25rem;display:flex;flex-direction:column;gap:1rem;">
      <div class="form-group"><label>Owner *</label><select formControlName="owner_id" (change)="onOwnerChange()"><option [ngValue]="null">Select</option><option *ngFor="let u of users" [ngValue]="u.id">{{ u.name }}</option></select></div>
      <div class="form-group"><label>Department</label><select formControlName="department_id"><option [ngValue]="null">Select</option><option *ngFor="let d of departments" [ngValue]="d.id">{{ d.name }}</option></select></div>
      <div class="form-group"><label>Location</label><select formControlName="location_id"><option [ngValue]="null">Select</option><option *ngFor="let l of locations" [ngValue]="l.id">{{ l.name }}</option></select></div>
      <div class="form-group"><label>Start Date</label><input type="date" formControlName="start_date" /></div>
      <div class="form-group"><label>End Date</label><input type="date" formControlName="end_date" /></div>
      <div class="form-group"><label>Priority</label><select formControlName="priority"><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
      <div class="form-group"><label>Status</label><select formControlName="status"><option value="planning">Planning</option><option value="active">Active</option><option value="on_hold">On Hold</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
    </div>
  </div>
</form>`,
  styles: [`
    .member-search-wrap{position:relative;}
    .member-search-input{width:100%;padding:.5rem .75rem;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-secondary);color:var(--text-primary);font-size:.8125rem;}
    .member-search-results{position:absolute;top:100%;left:0;right:0;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,.15);max-height:200px;overflow-y:auto;z-index:10;}
    .member-search-item{display:flex;align-items:center;gap:.5rem;padding:.5rem .75rem;cursor:pointer;font-size:.8125rem;}
    .member-search-item:hover{background:var(--bg-tertiary);}
    .selected-members{display:flex;flex-wrap:wrap;gap:.375rem;margin-top:.5rem;}
    .member-chip{display:flex;align-items:center;gap:.25rem;padding:.25rem .625rem;border-radius:999px;background:var(--accent-indigo-light, #e0e7ff);color:var(--accent-indigo, #4f46e5);font-size:.75rem;font-weight:500;}
    .chip-remove{background:none;border:none;color:inherit;font-size:.875rem;cursor:pointer;padding:0 .125rem;line-height:1;opacity:.7;}
    .chip-remove:hover{opacity:1;}
  `]
})
export class ProjectFormComponent implements OnInit {
  form: FormGroup;
  users: any[] = [];
  departments: any[] = [];
  locations: any[] = [];
  saving = false;
  editId: number | null = null;
  selectedMembers: any[] = [];
  memberSearch = '';

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router, private route: ActivatedRoute, private toast: ToastService, private cdr: ChangeDetectorRef) {
    this.form = this.fb.group({ title: ['', Validators.required], description: [''], owner_id: [null, Validators.required], department_id: [null], location_id: [null], start_date: [''], end_date: [''], priority: ['medium'], status: ['active'] });
  }

  ngOnInit(): void {
    this.editId = this.route.snapshot.params['id'] ? parseInt(this.route.snapshot.params['id']) : null;
    this.http.get<any>('/api/admin/users').subscribe({ next: r => { this.users = r.users || r; this.cdr.detectChanges(); } });
    this.http.get<any[]>('/api/admin/departments').subscribe({ next: r => { this.departments = r; this.cdr.detectChanges(); } });
    this.http.get<any[]>('/api/admin/locations').subscribe({ next: r => { this.locations = r; this.cdr.detectChanges(); } });
    if (this.editId) {
      this.http.get<any>(`/api/projects/${this.editId}`).subscribe({ next: p => {
        this.form.patchValue(p);
        this.selectedMembers = (p.members || []).map((m: any) => ({ user_id: m.user_id, name: m.name }));
        this.cdr.detectChanges();
      }});
    }
  }

  get filteredUsers(): any[] {
    const search = this.memberSearch.toLowerCase();
    const selectedIds = new Set(this.selectedMembers.map(m => m.user_id));
    return this.users.filter(u => !selectedIds.has(u.id) && (u.name?.toLowerCase().includes(search) || u.email?.toLowerCase().includes(search)));
  }

  addMember(user: any): void {
    if (!this.selectedMembers.some(m => m.user_id === user.id)) {
      this.selectedMembers.push({ user_id: user.id, name: user.name });
    }
    this.memberSearch = '';
    this.cdr.detectChanges();
  }

  removeMember(member: any): void {
    this.selectedMembers = this.selectedMembers.filter(m => m.user_id !== member.user_id);
    this.cdr.detectChanges();
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const payload = { ...this.form.value, member_ids: this.selectedMembers.map(m => m.user_id) };
    const req = this.editId ? this.http.put<any>(`/api/projects/${this.editId}`, payload) : this.http.post<any>('/api/projects', payload);
    req.subscribe({ next: r => { this.toast.success('Project saved'); this.router.navigate(['/projects', r.id]); }, error: (e) => { this.toast.error(e.error?.message || 'Save failed'); this.saving = false; this.cdr.detectChanges(); } });
  }

  onOwnerChange(): void {
    const ownerId = this.form.get('owner_id')?.value;
    if (ownerId) {
      const user = this.users.find(u => u.id === ownerId);
      if (user) {
        if (user.department_id) this.form.patchValue({ department_id: user.department_id });
        if (user.location_id) this.form.patchValue({ location_id: user.location_id });
        this.cdr.detectChanges();
      }
    }
  }
}
