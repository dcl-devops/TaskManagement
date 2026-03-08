import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastService } from '../../../core/toast.service';
import { AuthService } from '../../../core/auth.service';

@Component({
  standalone: false,
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss']
})
export class TaskFormComponent implements OnInit {
  form: FormGroup;
  loading = false;
  saving = false;
  editId: number | null = null;
  users: any[] = [];
  departments: any[] = [];
  locations: any[] = [];
  meetings: any[] = [];
  projects: any[] = [];
  tasks: any[] = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService,
    public auth: AuthService
  , private cdr: ChangeDetectorRef) {
    this.form = this.fb.group({
      category: ['task', Validators.required],
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      assigned_by: [null],
      assigned_to: [null, Validators.required],
      department_id: [null],
      location_id: [null],
      start_date: [new Date().toISOString().split('T')[0], Validators.required],
      due_date: [null],
      priority: ['medium', Validators.required],
      status: ['open'],
      tags: [''],
      estimated_effort: [null],
      parent_task_id: [null],
      meeting_id: [null],
      project_id: [null]
    });
  }

  ngOnInit(): void {
    this.editId = this.route.snapshot.params['id'] ? parseInt(this.route.snapshot.params['id']) : null;
    this.loadDropdowns();
    if (this.editId) this.loadTask();
    this.form.get('assigned_to')?.valueChanges.subscribe(uid => {
      const user = this.users.find(u => u.id == uid);
      if (user) {
        if (user.department_id) this.form.patchValue({ department_id: user.department_id });
        if (user.location_id) this.form.patchValue({ location_id: user.location_id });
      }
    });
  }

  loadDropdowns(): void {
    this.http.get<any>('/api/admin/users').subscribe({ next: r => { this.users = r.users || r; this.cdr.detectChanges(); } });
    this.http.get<any[]>('/api/admin/departments').subscribe({ next: r => { this.departments = r; this.cdr.detectChanges(); } });
    this.http.get<any[]>('/api/admin/locations').subscribe({ next: r => { this.locations = r; this.cdr.detectChanges(); } });
    this.http.get<any[]>('/api/meetings').subscribe({ next: r => { this.meetings = r; this.cdr.detectChanges(); } });
    this.http.get<any[]>('/api/projects').subscribe({ next: r => { this.projects = r; this.cdr.detectChanges(); } });
    this.http.get<any[]>('/api/tasks').subscribe({ next: r => { this.tasks = r; this.cdr.detectChanges(); } });
  }

  loadTask(): void {
    this.loading = true;
    this.http.get<any>(`/api/tasks/${this.editId}`).subscribe({
      next: t => {
        this.form.patchValue({
          ...t,
          start_date: t.start_date?.split('T')[0],
          due_date: t.due_date?.split('T')[0],
          tags: t.tags?.join(',') || ''
        });
        this.form.get('start_date')?.disable();
        this.loading = false; this.cdr.detectChanges();
      },
      error: () => this.loading = false
    });
  }

  get showParentTask(): boolean { return this.form.get('category')?.value === 'subtask'; }
  get showMeeting(): boolean { return this.form.get('category')?.value === 'meeting'; }
  get showProject(): boolean { return this.form.get('category')?.value === 'project'; }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const val = this.form.getRawValue();
    if (val.tags) val.tags = val.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    const req = this.editId
      ? this.http.put<any>(`/api/tasks/${this.editId}`, val)
      : this.http.post<any>('/api/tasks', val);
    req.subscribe({
      next: (task) => {
        this.toast.success(this.editId ? 'Task updated' : 'Task created');
        this.router.navigate(['/tasks', task.id]);
      },
      error: (err) => { this.toast.error(err.error?.message || 'Save failed'); this.saving = false; this.cdr.detectChanges(); }
    });
  }

  cancel(): void { this.router.navigate(['/tasks']); }
}
