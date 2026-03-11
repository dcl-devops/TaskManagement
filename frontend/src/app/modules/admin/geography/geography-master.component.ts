import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../core/toast.service';

type GeoType = 'countries' | 'states' | 'cities';

@Component({
  standalone: false,
  selector: 'app-geography-master',
  template: `
<div class="page-header">
  <h1>Geography Master</h1>
  <button class="btn btn-primary" (click)="showAdd = !showAdd" data-testid="add-geo-btn">+ Add {{ activeTab === 'countries' ? 'Country' : activeTab === 'states' ? 'State' : 'City' }}</button>
</div>

<div class="tabs-header" style="margin-bottom:1.5rem;background:var(--bg-card);border-radius:var(--radius-lg);border:1px solid var(--border-color);overflow:hidden;">
  <button class="tab-btn" [class.active]="activeTab === 'countries'" (click)="activeTab='countries';showAdd=false;" data-testid="tab-countries">
    Countries ({{ data.countries.length }})
  </button>
  <button class="tab-btn" [class.active]="activeTab === 'states'" (click)="activeTab='states';showAdd=false;" data-testid="tab-states">
    States ({{ data.states.length }})
  </button>
  <button class="tab-btn" [class.active]="activeTab === 'cities'" (click)="activeTab='cities';showAdd=false;" data-testid="tab-cities">
    Cities ({{ data.cities.length }})
  </button>
</div>

<div class="card" style="padding:1.5rem;">
  <!-- Add Form -->
  <div *ngIf="showAdd" class="add-form">
    <!-- Country -->
    <ng-container *ngIf="activeTab === 'countries'">
      <input type="text" [(ngModel)]="newName" placeholder="Country name" (keydown.enter)="addItem()" data-testid="new-country-name" />
      <input type="text" [(ngModel)]="newCode" placeholder="Code (e.g. IN)" style="max-width:80px;" data-testid="new-country-code" />
    </ng-container>
    <!-- State -->
    <ng-container *ngIf="activeTab === 'states'">
      <select [(ngModel)]="selectedCountryId" data-testid="new-state-country" style="min-width:160px;">
        <option [ngValue]="null">Select Country</option>
        <option *ngFor="let c of data.countries" [ngValue]="c.id">{{ c.name }}</option>
      </select>
      <input type="text" [(ngModel)]="newName" placeholder="State name" (keydown.enter)="addItem()" data-testid="new-state-name" />
    </ng-container>
    <!-- City -->
    <ng-container *ngIf="activeTab === 'cities'">
      <select [(ngModel)]="selectedCountryIdForCity" (change)="onCityCountryChange()" data-testid="new-city-country" style="min-width:160px;">
        <option [ngValue]="null">Select Country</option>
        <option *ngFor="let c of data.countries" [ngValue]="c.id">{{ c.name }}</option>
      </select>
      <select [(ngModel)]="selectedStateId" data-testid="new-city-state" style="min-width:160px;">
        <option [ngValue]="null">Select State</option>
        <option *ngFor="let s of filteredStatesForCity" [ngValue]="s.id">{{ s.name }}</option>
      </select>
      <input type="text" [(ngModel)]="newName" placeholder="City name" (keydown.enter)="addItem()" data-testid="new-city-name" />
    </ng-container>
    <button class="btn btn-primary btn-sm" (click)="addItem()" [disabled]="saving || !newName.trim()" data-testid="save-geo-btn">{{ saving ? 'Adding...' : 'Add' }}</button>
    <button class="btn btn-secondary btn-sm" (click)="showAdd=false;newName='';newCode=''">Cancel</button>
  </div>

  <!-- Search -->
  <div class="search-wrapper" style="margin-bottom:1rem;max-width:300px;">
    <span class="search-icon">&#128269;</span>
    <input type="text" [(ngModel)]="searchQuery" placeholder="Search..." (input)="applySearch()" data-testid="geo-search" />
  </div>

  <!-- Country List -->
  <div *ngIf="activeTab === 'countries'" class="master-list">
    <div *ngFor="let item of displayItems" class="master-item">
      <div *ngIf="editItem?.id !== item.id" style="display:flex;align-items:center;justify-content:space-between;">
        <span><span class="font-medium">{{ item.name }}</span> <span class="text-xs text-muted" *ngIf="item.code">({{ item.code }})</span></span>
        <div style="display:flex;gap:.5rem;">
          <button class="btn btn-ghost btn-sm btn-icon" (click)="startEdit(item)">&#9998;</button>
          <button class="btn btn-ghost btn-sm btn-icon" style="color:#ef4444;" (click)="deleteItem(item)">&#128465;</button>
        </div>
      </div>
      <div *ngIf="editItem?.id === item.id" style="display:flex;gap:.75rem;align-items:center;">
        <input type="text" [(ngModel)]="editName" style="flex:1;" />
        <input type="text" [(ngModel)]="editCode" style="max-width:80px;" placeholder="Code" />
        <button class="btn btn-primary btn-sm" (click)="saveEdit()">Save</button>
        <button class="btn btn-secondary btn-sm" (click)="editItem=null">Cancel</button>
      </div>
    </div>
  </div>

  <!-- State List -->
  <div *ngIf="activeTab === 'states'" class="master-list">
    <div *ngFor="let item of displayItems" class="master-item">
      <div *ngIf="editItem?.id !== item.id" style="display:flex;align-items:center;justify-content:space-between;">
        <span><span class="font-medium">{{ item.name }}</span> <span class="text-xs text-muted">{{ item.country_name }}</span></span>
        <div style="display:flex;gap:.5rem;">
          <button class="btn btn-ghost btn-sm btn-icon" (click)="startEdit(item)">&#9998;</button>
          <button class="btn btn-ghost btn-sm btn-icon" style="color:#ef4444;" (click)="deleteItem(item)">&#128465;</button>
        </div>
      </div>
      <div *ngIf="editItem?.id === item.id" style="display:flex;gap:.75rem;align-items:center;">
        <select [(ngModel)]="editCountryId" style="min-width:140px;"><option *ngFor="let c of data.countries" [ngValue]="c.id">{{ c.name }}</option></select>
        <input type="text" [(ngModel)]="editName" style="flex:1;" />
        <button class="btn btn-primary btn-sm" (click)="saveEdit()">Save</button>
        <button class="btn btn-secondary btn-sm" (click)="editItem=null">Cancel</button>
      </div>
    </div>
  </div>

  <!-- City List -->
  <div *ngIf="activeTab === 'cities'" class="master-list">
    <div *ngFor="let item of displayItems" class="master-item">
      <div *ngIf="editItem?.id !== item.id" style="display:flex;align-items:center;justify-content:space-between;">
        <span><span class="font-medium">{{ item.name }}</span> <span class="text-xs text-muted">{{ item.state_name }}, {{ item.country_name }}</span></span>
        <div style="display:flex;gap:.5rem;">
          <button class="btn btn-ghost btn-sm btn-icon" (click)="startEdit(item)">&#9998;</button>
          <button class="btn btn-ghost btn-sm btn-icon" style="color:#ef4444;" (click)="deleteItem(item)">&#128465;</button>
        </div>
      </div>
      <div *ngIf="editItem?.id === item.id" style="display:flex;gap:.75rem;align-items:center;">
        <input type="text" [(ngModel)]="editName" style="flex:1;" />
        <button class="btn btn-primary btn-sm" (click)="saveEdit()">Save</button>
        <button class="btn btn-secondary btn-sm" (click)="editItem=null">Cancel</button>
      </div>
    </div>
  </div>

  <div *ngIf="displayItems.length === 0" class="empty-state" style="padding:2rem;"><p>No {{ activeTab }} found.</p></div>
</div>
  `,
  styles: [`
    .add-form { display:flex; gap:0.75rem; align-items:center; flex-wrap:wrap; margin-bottom:1.5rem; padding:1rem; background:var(--bg-secondary); border-radius:var(--radius); }
    .add-form input, .add-form select { height: 36px; }
  `]
})
export class GeographyMasterComponent implements OnInit {
  activeTab: GeoType = 'cities';
  data: Record<GeoType, any[]> = { countries: [], states: [], cities: [] };
  displayItems: any[] = [];
  searchQuery = '';
  showAdd = false;
  newName = '';
  newCode = '';
  selectedCountryId: number | null = null;
  selectedCountryIdForCity: number | null = null;
  selectedStateId: number | null = null;
  filteredStatesForCity: any[] = [];
  editItem: any = null;
  editName = '';
  editCode = '';
  editCountryId: number | null = null;
  saving = false;

  constructor(private http: HttpClient, private toast: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.http.get<any[]>('/api/geography/countries').subscribe({ next: r => { this.data.countries = r; this.applySearch(); this.cdr.detectChanges(); } });
    this.http.get<any[]>('/api/geography/states').subscribe({ next: r => { this.data.states = r; this.applySearch(); this.cdr.detectChanges(); } });
    this.http.get<any[]>('/api/geography/cities').subscribe({ next: r => { this.data.cities = r; this.applySearch(); this.cdr.detectChanges(); } });
  }

  applySearch(): void {
    let items = this.data[this.activeTab];
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      items = items.filter(i => i.name?.toLowerCase().includes(q));
    }
    this.displayItems = items;
    this.cdr.detectChanges();
  }

  onCityCountryChange(): void {
    this.selectedStateId = null;
    this.filteredStatesForCity = this.selectedCountryIdForCity
      ? this.data.states.filter(s => s.country_id === this.selectedCountryIdForCity)
      : [];
    this.cdr.detectChanges();
  }

  addItem(): void {
    if (!this.newName.trim()) return;
    this.saving = true;
    let payload: any = { name: this.newName };
    if (this.activeTab === 'countries') { payload.code = this.newCode || null; }
    if (this.activeTab === 'states') { payload.country_id = this.selectedCountryId; }
    if (this.activeTab === 'cities') { payload.state_id = this.selectedStateId; }

    this.http.post<any>(`/api/geography/${this.activeTab}`, payload).subscribe({
      next: r => {
        this.loadAll();
        this.newName = ''; this.newCode = ''; this.showAdd = false; this.saving = false;
        this.toast.success('Added successfully');
        this.cdr.detectChanges();
      },
      error: (e) => { this.toast.error(e.error?.message || 'Failed'); this.saving = false; this.cdr.detectChanges(); }
    });
  }

  startEdit(item: any): void {
    this.editItem = item;
    this.editName = item.name;
    this.editCode = item.code || '';
    this.editCountryId = item.country_id || null;
  }

  saveEdit(): void {
    let payload: any = { name: this.editName };
    if (this.activeTab === 'countries') payload.code = this.editCode;
    if (this.activeTab === 'states') payload.country_id = this.editCountryId;
    this.http.put<any>(`/api/geography/${this.activeTab}/${this.editItem.id}`, payload).subscribe({
      next: () => { this.loadAll(); this.editItem = null; this.toast.success('Updated'); this.cdr.detectChanges(); }
    });
  }

  deleteItem(item: any): void {
    if (!confirm(`Delete "${item.name}"?`)) return;
    this.http.delete(`/api/geography/${this.activeTab}/${item.id}`).subscribe({
      next: () => { this.loadAll(); this.toast.success('Deleted'); this.cdr.detectChanges(); }
    });
  }
}
