import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-customer-list',
  template: `
    <div class="page-header">
      <h1>Customers <span class="task-count-badge" data-testid="customer-count">{{ filteredCustomers.length }}</span></h1>
      <div class="header-actions">
        <button class="btn btn-primary" routerLink="/customers/new" data-testid="new-customer-btn">+ New Customer</button>
      </div>
    </div>
    <div class="card filter-bar">
      <div class="filter-row">
        <div class="search-wrapper" style="flex:1;max-width:300px;">
          <span class="search-icon">&#128269;</span>
          <input type="text" [(ngModel)]="search" placeholder="Search customers..." (input)="applyFilters()" data-testid="customer-search" />
        </div>
        <select [(ngModel)]="filterStatus" (change)="applyFilters()" data-testid="filter-status">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select [(ngModel)]="filterIndustry" (change)="applyFilters()" data-testid="filter-industry">
          <option value="">All Industries</option>
          <option *ngFor="let i of industries" [value]="i">{{ i }}</option>
        </select>
        <button class="btn btn-ghost btn-sm" (click)="clearFilters()">Clear</button>
      </div>
    </div>
    <div *ngIf="loading" class="loading-overlay"><div class="spinner"></div></div>
    <div class="card table-container" *ngIf="!loading">
      <table data-testid="customers-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Industry</th>
            <th>City</th>
            <th>Contact Person</th>
            <th>Email</th>
            <th>Projects</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let c of filteredCustomers" style="cursor:pointer;" [attr.data-testid]="'customer-' + c.id">
            <td class="text-sm text-muted">{{ c.customer_code || '-' }}</td>
            <td class="font-medium text-sm" (click)="open(c.id)">{{ c.name }}</td>
            <td class="text-sm">{{ c.industry || '-' }}</td>
            <td class="text-sm">{{ c.city || '-' }}</td>
            <td class="text-sm">{{ c.contact_person || '-' }}</td>
            <td class="text-sm">{{ c.email || '-' }}</td>
            <td class="text-sm">{{ c.project_count || 0 }}</td>
            <td>
              <span class="status-badge" [class.active]="c.status === 'active'" [class.inactive]="c.status === 'inactive'">
                {{ c.status | formatLabel }}
              </span>
            </td>
            <td>
              <div style="display:flex;gap:.5rem;">
                <a [routerLink]="['/customers', c.id, 'edit']" class="btn btn-ghost btn-sm btn-icon" (click)="$event.stopPropagation()" data-testid="edit-customer-btn">&#9998;</a>
                <button class="btn btn-ghost btn-sm btn-icon" style="color:#ef4444;" (click)="deleteCustomer(c, $event)" data-testid="delete-customer-btn">&#128465;</button>
              </div>
            </td>
          </tr>
          <tr *ngIf="filteredCustomers.length === 0">
            <td colspan="9">
              <div class="empty-state" style="padding:2rem;">
                <h3>No customers found</h3>
                <p>{{ customers.length > 0 ? 'Try adjusting your filters' : 'Create your first customer' }}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .filter-bar { padding: 0.75rem 1rem; margin-bottom: 1rem; }
    .filter-row { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
    .filter-row select { width: auto; min-width: 130px; height: 36px; }
  `]
})
export class CustomerListComponent implements OnInit {
  customers: any[] = [];
  filteredCustomers: any[] = [];
  industries: string[] = [];
  loading = true;
  search = '';
  filterStatus = '';
  filterIndustry = '';

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.http.get<any[]>('/api/customers').subscribe({
      next: r => {
        this.customers = r;
        this.industries = [...new Set(r.map(c => c.industry).filter(Boolean))];
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  applyFilters(): void {
    let list = [...this.customers];
    if (this.search) {
      const s = this.search.toLowerCase();
      list = list.filter(c => c.name?.toLowerCase().includes(s) || c.customer_code?.toLowerCase().includes(s) || c.contact_person?.toLowerCase().includes(s));
    }
    if (this.filterStatus) list = list.filter(c => c.status === this.filterStatus);
    if (this.filterIndustry) list = list.filter(c => c.industry === this.filterIndustry);
    this.filteredCustomers = list;
    this.cdr.detectChanges();
  }

  clearFilters(): void {
    this.search = ''; this.filterStatus = ''; this.filterIndustry = '';
    this.applyFilters();
  }

  open(id: number): void { this.router.navigate(['/customers', id]); }

  deleteCustomer(c: any, event: Event): void {
    event.stopPropagation();
    if (!confirm(`Delete customer "${c.name}"? This cannot be undone.`)) return;
    this.http.delete(`/api/customers/${c.id}`).subscribe({
      next: () => { this.customers = this.customers.filter(x => x.id !== c.id); this.applyFilters(); },
      error: () => {}
    });
  }
}
