import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from '../../../core/toast.service';
import { AuthService } from '../../../core/auth.service';

@Component({
  standalone: false,
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  users: any[] = [];
  total = 0;
  loading = false;
  showForm = false;
  editingUser: any = null;
  form: FormGroup;
  companies: any[] = [];
  locations: any[] = [];
  departments: any[] = [];
  designations: any[] = [];
  allUsers: any[] = [];
  search = '';
  roleFilter = '';
  statusFilter = '';
  saving = false;

  constructor(private http: HttpClient, private fb: FormBuilder, private toast: ToastService, public auth: AuthService, private cdr: ChangeDetectorRef) {
    this.form = this.fb.group({
      employee_code: [''],
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      mobile: [''],
      company_id: [null],
      location_id: [null],
      department_id: [null],
      designation_id: [null],
      manager_id: [null],
      role: ['user', Validators.required],
      status: ['active', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadDropdowns();
    this.load();
  }

  loadDropdowns(): void {
    this.http.get<any[]>('/api/admin/companies').subscribe({ next: r => { this.companies = r; this.cdr.detectChanges(); } });
    this.http.get<any[]>('/api/admin/locations').subscribe({ next: r => { this.locations = r; this.cdr.detectChanges(); } });
    this.http.get<any[]>('/api/admin/departments').subscribe({ next: r => { this.departments = r; this.cdr.detectChanges(); } });
    this.http.get<any[]>('/api/admin/designations').subscribe({ next: r => { this.designations = r; this.cdr.detectChanges(); } });
    this.http.get<any>('/api/admin/users').subscribe({ next: r => { this.allUsers = r.users || r; this.cdr.detectChanges(); } });
  }

  load(): void {
    this.loading = true;
    const params: any = {};
    if (this.search) params['search'] = this.search;
    if (this.roleFilter) params['role'] = this.roleFilter;
    if (this.statusFilter) params['status'] = this.statusFilter;
    this.http.get<any>('/api/admin/users', { params }).subscribe({
      next: r => { this.users = r.users || r; this.total = r.total || this.users.length; this.loading = false; this.cdr.detectChanges(); },
      error: () => this.loading = false
    });
  }

  openNew(): void {
    this.editingUser = null;
    this.form.reset({ role: 'user', status: 'active' });
    this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    this.form.get('email')?.enable();
    this.showForm = true;
  }

  editUser(user: any): void {
    this.editingUser = user;
    this.form.patchValue(user);
    this.form.get('password')?.clearValidators();
    this.form.get('email')?.disable();
    this.showForm = true;
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const val = this.form.getRawValue();
    const req = this.editingUser
      ? this.http.put<any>(`/api/admin/users/${this.editingUser.id}`, val)
      : this.http.post<any>('/api/admin/users', val);
    req.subscribe({
      next: () => {
        this.toast.success(this.editingUser ? 'User updated' : 'User created');
        this.showForm = false;
        this.load();
        this.loadDropdowns();
        this.saving = false;
      },
      error: (err) => { this.toast.error(err.error?.message || 'Save failed'); this.saving = false; }
    });
  }

  resetPassword(user: any): void {
    const pwd = prompt(`Set new password for ${user.name} (min 8 chars):`);
    if (!pwd || pwd.length < 8) { this.toast.error('Password must be at least 8 characters'); return; }
    this.http.post(`/api/admin/users/${user.id}/reset-password`, { newPassword: pwd }).subscribe({
      next: () => this.toast.success('Password reset successfully'),
      error: () => this.toast.error('Reset failed')
    });
  }

  toggleStatus(user: any): void {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    this.http.put<any>(`/api/admin/users/${user.id}`, { ...user, status: newStatus }).subscribe({
      next: () => { user.status = newStatus; this.toast.success(`User ${newStatus}`); }
    });
  }
}
