import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastService } from '../../../core/toast.service';

@Component({
  standalone: false,
  selector: 'app-meeting-form',
  templateUrl: './meeting-form.component.html',
  styles: [`
    .form-grid{display:grid;grid-template-columns:1fr 300px;gap:1.5rem;align-items:start;}
    .form-body{padding:1.25rem;display:flex;flex-direction:column;gap:1rem;}
    .card-header-sm{padding:.75rem 1.25rem;font-size:.875rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border-color);}
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
export class MeetingFormComponent implements OnInit {
  form: FormGroup;
  users: any[] = [];
  locations: any[] = [];
  projects: any[] = [];
  saving = false;
  loading = false;
  editId: number | null = null;
  selectedMembers: any[] = [];
  memberSearch = '';

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router, private route: ActivatedRoute, private toast: ToastService, private cdr: ChangeDetectorRef) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      owner_id: [null, Validators.required],
      meeting_date: ['', Validators.required],
      location_id: [null],
      virtual_link: [''],
      status: ['open', Validators.required],
      project_id: [null]
    });
  }

  ngOnInit(): void {
    this.editId = this.route.snapshot.params['id'] ? parseInt(this.route.snapshot.params['id']) : null;
    this.http.get<any>('/api/admin/users').subscribe({ next: r => { this.users = r.users || r; this.cdr.detectChanges(); } });
    this.http.get<any[]>('/api/admin/locations').subscribe({ next: r => { this.locations = r; this.cdr.detectChanges(); } });
    this.http.get<any[]>('/api/projects').subscribe({ next: r => { this.projects = r; this.cdr.detectChanges(); } });
    if (this.editId) {
      this.loading = true;
      this.http.get<any>(`/api/meetings/${this.editId}`).subscribe({
        next: m => {
          this.form.patchValue({ ...m, meeting_date: m.meeting_date?.slice(0, 16) });
          this.selectedMembers = (m.members || []).map((mb: any) => ({ user_id: mb.user_id, name: mb.name }));
          this.loading = false; this.cdr.detectChanges();
        }
      });
    }
    const projectId = this.route.snapshot.queryParams['project_id'];
    if (projectId) this.form.patchValue({ project_id: parseInt(projectId) });
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
    const req = this.editId
      ? this.http.put<any>(`/api/meetings/${this.editId}`, payload)
      : this.http.post<any>('/api/meetings', payload);
    req.subscribe({
      next: (r) => { this.toast.success(this.editId ? 'Meeting updated' : 'Meeting created'); this.router.navigate(['/meetings', r.id]); },
      error: (err) => { this.toast.error(err.error?.message || 'Save failed'); this.saving = false; this.cdr.detectChanges(); }
    });
  }
}
