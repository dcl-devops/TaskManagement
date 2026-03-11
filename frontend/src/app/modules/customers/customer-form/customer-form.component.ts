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

      <!-- City autocomplete -->
      <div class="form-group" style="position:relative;">
        <label>City</label>
        <input type="text" [(ngModel)]="citySearch" [ngModelOptions]="{standalone:true}"
          placeholder="Type to search city..." (input)="onCitySearch()" (focus)="showCityDropdown=true"
          data-testid="cust-city" autocomplete="off" />
        <div class="autocomplete-dropdown" *ngIf="showCityDropdown && filteredCities.length > 0">
          <div *ngFor="let c of filteredCities" class="autocomplete-item" (mousedown)="selectCity(c)">
            <span class="font-medium">{{ c.name }}</span>
            <span class="text-xs text-muted">{{ c.state_name }}, {{ c.country_name }}</span>
          </div>
        </div>
      </div>

      <!-- State autocomplete -->
      <div class="form-group" style="position:relative;">
        <label>State</label>
        <input type="text" [(ngModel)]="stateSearch" [ngModelOptions]="{standalone:true}"
          placeholder="Type to search state..." (input)="onStateSearch()" (focus)="showStateDropdown=true"
          data-testid="cust-state" autocomplete="off" />
        <div class="autocomplete-dropdown" *ngIf="showStateDropdown && filteredStates.length > 0">
          <div *ngFor="let s of filteredStates" class="autocomplete-item" (mousedown)="selectState(s)">
            <span class="font-medium">{{ s.name }}</span>
            <span class="text-xs text-muted">{{ s.country_name }}</span>
          </div>
        </div>
      </div>

      <!-- Country autocomplete -->
      <div class="form-group" style="position:relative;">
        <label>Country</label>
        <input type="text" [(ngModel)]="countrySearch" [ngModelOptions]="{standalone:true}"
          placeholder="Type to search country..." (input)="onCountrySearch()" (focus)="showCountryDropdown=true"
          data-testid="cust-country" autocomplete="off" />
        <div class="autocomplete-dropdown" *ngIf="showCountryDropdown && filteredCountries.length > 0">
          <div *ngFor="let c of filteredCountries" class="autocomplete-item" (mousedown)="selectCountry(c)">
            <span class="font-medium">{{ c.name }}</span>
            <span class="text-xs text-muted" *ngIf="c.code">({{ c.code }})</span>
          </div>
        </div>
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
  styles: [`
    .autocomplete-dropdown {
      position:absolute; top:100%; left:0; right:0; margin-top:2px;
      background:var(--bg-card); border:1px solid var(--border-color);
      border-radius:var(--radius); box-shadow:var(--shadow-lg);
      z-index:20; max-height:200px; overflow-y:auto;
    }
    .autocomplete-item {
      display:flex; justify-content:space-between; align-items:center;
      padding:0.5rem 0.75rem; cursor:pointer; font-size:0.8125rem;
    }
    .autocomplete-item:hover { background:var(--bg-hover); }
  `]
})
export class CustomerFormComponent implements OnInit {
  form: FormGroup;
  saving = false;
  editId: number | null = null;

  // Autocomplete state
  allCities: any[] = [];
  allStates: any[] = [];
  allCountries: any[] = [];
  filteredCities: any[] = [];
  filteredStates: any[] = [];
  filteredCountries: any[] = [];
  citySearch = '';
  stateSearch = '';
  countrySearch = '';
  showCityDropdown = false;
  showStateDropdown = false;
  showCountryDropdown = false;

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

    // Load geography data
    this.http.get<any[]>('/api/geography/cities').subscribe({ next: r => { this.allCities = r; this.cdr.detectChanges(); } });
    this.http.get<any[]>('/api/geography/states').subscribe({ next: r => { this.allStates = r; this.cdr.detectChanges(); } });
    this.http.get<any[]>('/api/geography/countries').subscribe({ next: r => { this.allCountries = r; this.cdr.detectChanges(); } });

    if (this.editId) {
      this.http.get<any>(`/api/customers/${this.editId}`).subscribe({
        next: c => {
          this.form.patchValue(c);
          this.citySearch = c.city || '';
          this.stateSearch = c.state || '';
          this.countrySearch = c.country || '';
          this.cdr.detectChanges();
        },
        error: () => { this.toast.error('Customer not found'); this.router.navigate(['/customers']); }
      });
    }
  }

  // City autocomplete
  onCitySearch(): void {
    const q = this.citySearch.toLowerCase();
    this.filteredCities = q.length >= 1 ? this.allCities.filter(c => c.name.toLowerCase().includes(q)).slice(0, 15) : [];
    this.showCityDropdown = true;
    this.form.patchValue({ city: this.citySearch });
    this.cdr.detectChanges();
  }

  selectCity(city: any): void {
    this.citySearch = city.name;
    this.stateSearch = city.state_name;
    this.countrySearch = city.country_name;
    this.form.patchValue({ city: city.name, state: city.state_name, country: city.country_name });
    this.showCityDropdown = false;
    this.cdr.detectChanges();
  }

  // State autocomplete
  onStateSearch(): void {
    const q = this.stateSearch.toLowerCase();
    this.filteredStates = q.length >= 1 ? this.allStates.filter(s => s.name.toLowerCase().includes(q)).slice(0, 15) : [];
    this.showStateDropdown = true;
    this.form.patchValue({ state: this.stateSearch });
    this.cdr.detectChanges();
  }

  selectState(state: any): void {
    this.stateSearch = state.name;
    this.countrySearch = state.country_name;
    this.form.patchValue({ state: state.name, country: state.country_name });
    this.showStateDropdown = false;
    this.cdr.detectChanges();
  }

  // Country autocomplete
  onCountrySearch(): void {
    const q = this.countrySearch.toLowerCase();
    this.filteredCountries = q.length >= 1 ? this.allCountries.filter(c => c.name.toLowerCase().includes(q)).slice(0, 15) : [];
    this.showCountryDropdown = true;
    this.form.patchValue({ country: this.countrySearch });
    this.cdr.detectChanges();
  }

  selectCountry(country: any): void {
    this.countrySearch = country.name;
    this.form.patchValue({ country: country.name });
    this.showCountryDropdown = false;
    this.cdr.detectChanges();
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
