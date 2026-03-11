import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastService } from '../../../core/toast.service';

@Component({
  standalone: false,
  selector: 'app-customer-form',
  template: `
<div class="page-header">
  <h1>{{ editId ? 'Edit Customer' : 'New Customer' }}</h1>
  <div class="header-actions">
    <button class="btn btn-secondary" routerLink="/customers">Cancel</button>
    <button class="btn btn-primary" (click)="save()" [disabled]="saving" data-testid="save-customer-btn">{{ saving ? 'Saving...' : (editId ? 'Update' : 'Create Customer') }}</button>
  </div>
</div>
<form [formGroup]="form" style="display:grid;grid-template-columns:1fr 300px;gap:1.5rem;align-items:start;">
  <div class="card">
    <div style="padding:1.25rem;display:flex;flex-direction:column;gap:1rem;">
      <div class="form-group"><label>Customer Name *</label><input formControlName="name" data-testid="cust-name" /></div>
      <div class="form-group"><label>Customer Code</label><input formControlName="customer_code" data-testid="cust-code" /></div>
      <div class="form-group"><label>Address</label><textarea formControlName="address" rows="3"></textarea></div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;">
        <div class="form-group"><label>City</label><input formControlName="city" data-testid="cust-city" /></div>
        <div class="form-group"><label>State</label><input formControlName="state" data-testid="cust-state" /></div>
        <div class="form-group"><label>Country</label><input formControlName="country" data-testid="cust-country" /></div>
      </div>
      <div class="form-group"><label>Industry</label><input formControlName="industry" data-testid="cust-industry" /></div>
    </div>
  </div>
  <div class="card">
    <div style="padding:.75rem 1.25rem;font-size:.875rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border-color);">Contact Info</div>
    <div style="padding:1.25rem;display:flex;flex-direction:column;gap:1rem;">
      <div class="form-group"><label>Contact Person</label><input formControlName="contact_person" data-testid="cust-contact" /></div>
      <div class="form-group"><label>Mobile</label><input formControlName="mobile" data-testid="cust-mobile" /></div>
      <div class="form-group"><label>Email</label><input type="email" formControlName="email" data-testid="cust-email" /></div>
      <div class="form-group"><label>Status</label>
        <select formControlName="status">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </div>
  </div>
</form>`,
  styles: []
})
export class CustomerFormComponent implements OnInit {
  form: FormGroup;
  saving = false;
  editId: number | null = null;

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router, private route: ActivatedRoute, private toast: ToastService, private cdr: ChangeDetectorRef) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      customer_code: [''],
      address: [''],
      city: [''],
      state: [''],
      country: [''],
      industry: [''],
      contact_person: [''],
      mobile: [''],
      email: [''],
      status: ['active']
    });
  }

  ngOnInit(): void {
    this.editId = this.route.snapshot.params['id'] ? parseInt(this.route.snapshot.params['id']) : null;
    if (this.editId) {
      this.http.get<any>(`/api/customers/${this.editId}`).subscribe({
        next: c => { this.form.patchValue(c); this.cdr.detectChanges(); },
        error: () => { this.toast.error('Customer not found'); this.router.navigate(['/customers']); }
      });
    }
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const payload = this.form.value;
    const req = this.editId
      ? this.http.put<any>(`/api/customers/${this.editId}`, payload)
      : this.http.post<any>('/api/customers', payload);
    req.subscribe({
      next: r => { this.toast.success('Customer saved'); this.router.navigate(['/customers', r.id || this.editId]); },
      error: (e) => { this.toast.error(e.error?.message || 'Save failed'); this.saving = false; this.cdr.detectChanges(); }
    });
  }
}
