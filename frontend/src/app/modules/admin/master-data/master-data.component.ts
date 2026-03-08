import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../core/toast.service';

type MasterType = 'companies' | 'locations' | 'departments' | 'designations';

@Component({
  standalone: false,
  selector: 'app-master-data',
  templateUrl: './master-data.component.html',
  styleUrls: ['./master-data.component.scss']
})
export class MasterDataComponent implements OnInit {
  activeTab: MasterType = 'departments';
  data: Record<MasterType, any[]> = { companies: [], locations: [], departments: [], designations: [] };
  loading = false;
  showAdd = false;
  newName = '';
  editItem: any = null;
  editName = '';
  saving = false;

  tabs: { key: MasterType; label: string; icon: string }[] = [
    { key: 'departments', label: 'Departments', icon: '&#127968;' },
    { key: 'locations', label: 'Locations', icon: '&#128205;' },
    { key: 'companies', label: 'Companies', icon: '&#127970;' },
    { key: 'designations', label: 'Designations', icon: '&#127892;' }
  ];

  constructor(private http: HttpClient, private toast: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    (['companies', 'locations', 'departments', 'designations'] as MasterType[]).forEach(type => {
      this.http.get<any[]>(`/api/admin/${type}`).subscribe({ next: r => { this.data[type] = r; this.cdr.detectChanges(); } });
    });
  }

  get items(): any[] { return this.data[this.activeTab]; }

  addItem(): void {
    if (!this.newName.trim()) return;
    this.saving = true;
    this.http.post<any>(`/api/admin/${this.activeTab}`, { name: this.newName }).subscribe({
      next: r => { this.data[this.activeTab].push(r); this.newName = ''; this.showAdd = false; this.saving = false; this.toast.success('Added successfully'); },
      error: (err) => { this.toast.error(err.error?.message || 'Failed to add'); this.saving = false; }
    });
  }

  startEdit(item: any): void { this.editItem = item; this.editName = item.name; }

  saveEdit(): void {
    if (!this.editName.trim()) return;
    this.http.put<any>(`/api/admin/${this.activeTab}/${this.editItem.id}`, { name: this.editName }).subscribe({
      next: r => { this.editItem.name = r.name; this.editItem = null; this.toast.success('Updated'); }
    });
  }

  deleteItem(item: any): void {
    if (!confirm(`Delete "${item.name}"?`)) return;
    this.http.delete(`/api/admin/${this.activeTab}/${item.id}`).subscribe({
      next: () => { this.data[this.activeTab] = this.data[this.activeTab].filter(i => i.id !== item.id); this.toast.success('Deleted'); }
    });
  }
}
