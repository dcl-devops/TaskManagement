import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastService } from '../../../core/toast.service';

@Component({
  standalone: false,
  selector: 'app-meeting-form',
  templateUrl: './meeting-form.component.html',
  styles: [`.form-grid{display:grid;grid-template-columns:1fr 300px;gap:1.5rem;align-items:start;} .form-body{padding:1.25rem;display:flex;flex-direction:column;gap:1rem;} .card-header-sm{padding:.75rem 1.25rem;font-size:.875rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border-color);}`]
})
export class MeetingFormComponent implements OnInit {
  form: FormGroup;
  users: any[] = [];
  locations: any[] = [];
  saving = false;
  loading = false;
  editId: number | null = null;
  selectedMembers: any[] = [];

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router, private route: ActivatedRoute, private toast: ToastService, private cdr: ChangeDetectorRef) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      owner_id: [null, Validators.required],
      meeting_date: ['', Validators.required],
      location_id: [null],
      virtual_link: [''],
      status: ['open', Validators.required]
    });
  }

  ngOnInit(): void {
    this.editId = this.route.snapshot.params['id'] ? parseInt(this.route.snapshot.params['id']) : null;
    this.http.get<any>('/api/admin/users').subscribe({ next: r => { this.users = r.users || r; this.cdr.detectChanges(); } });
    this.http.get<any[]>('/api/admin/locations').subscribe({ next: r => { this.locations = r; this.cdr.detectChanges(); } });
    if (this.editId) {
      this.loading = true;
      this.http.get<any>(`/api/meetings/${this.editId}`).subscribe({
        next: m => {
          this.form.patchValue({ ...m, meeting_date: m.meeting_date?.slice(0, 16) });
          this.selectedMembers = m.members || [];
          this.loading = false; this.cdr.detectChanges();
        }
      });
    }
  }

  toggleMember(user: any): void {
    const idx = this.selectedMembers.findIndex(m => m.user_id === user.id);
    if (idx >= 0) this.selectedMembers.splice(idx, 1);
    else this.selectedMembers.push({ user_id: user.id, name: user.name });
  }

  isMember(userId: number): boolean { return this.selectedMembers.some(m => m.user_id === userId); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const payload = { ...this.form.value, member_ids: this.selectedMembers.map(m => m.user_id) };
    const req = this.editId
      ? this.http.put<any>(`/api/meetings/${this.editId}`, payload)
      : this.http.post<any>('/api/meetings', payload);
    req.subscribe({
      next: (r) => { this.toast.success(this.editId ? 'Meeting updated' : 'Meeting created'); this.router.navigate(['/meetings', r.id]); },
      error: (err) => { this.toast.error(err.error?.message || 'Save failed'); this.saving = false; }
    });
  }
}
