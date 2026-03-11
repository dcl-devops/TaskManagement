import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-member-search',
  template: `
    <div class="member-search-wrap">
      <input type="text" [(ngModel)]="searchText" [ngModelOptions]="{standalone: true}"
        placeholder="Type to search members..." class="member-search-input"
        data-testid="member-search" />
      <div class="member-search-results" *ngIf="searchText.length >= 1 && filteredUsers.length > 0">
        <div *ngFor="let u of filteredUsers" class="member-search-item" (click)="onAdd(u)">
          <img *ngIf="u.avatar_url" [src]="u.avatar_url" class="avatar avatar-sm avatar-img" />
          <div class="avatar avatar-sm" *ngIf="!u.avatar_url">{{ u.name?.charAt(0) }}</div>
          <span class="text-sm">{{ u.name }}</span>
          <span class="text-xs text-muted">{{ u.email }}</span>
        </div>
      </div>
    </div>
    <div class="selected-members" *ngIf="selected.length > 0">
      <div *ngFor="let m of selected" class="member-chip">
        <span>{{ m.name }}</span>
        <button class="chip-remove" (click)="onRemove(m)">&times;</button>
      </div>
    </div>
  `,
  styles: [`
    .member-search-wrap{position:relative;}
    .member-search-input{width:100%;padding:.5rem .75rem;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-secondary);color:var(--text-primary);font-size:.8125rem;}
    .member-search-results{position:absolute;top:100%;left:0;right:0;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,.15);max-height:200px;overflow-y:auto;z-index:10;}
    .member-search-item{display:flex;align-items:center;gap:.5rem;padding:.5rem .75rem;cursor:pointer;font-size:.8125rem;}
    .member-search-item:hover{background:var(--bg-tertiary);}
    .selected-members{display:flex;flex-wrap:wrap;gap:.375rem;margin-top:.5rem;}
    .member-chip{display:flex;align-items:center;gap:.25rem;padding:.25rem .625rem;border-radius:999px;background:var(--accent-blue-light, #dbeafe);color:var(--accent-blue, #2563eb);font-size:.75rem;font-weight:500;}
    .chip-remove{background:none;border:none;color:inherit;font-size:.875rem;cursor:pointer;padding:0 .125rem;line-height:1;opacity:.7;}
    .chip-remove:hover{opacity:1;}
  `]
})
export class MemberSearchComponent {
  @Input() users: any[] = [];
  @Input() selected: { user_id: number; name: string }[] = [];
  @Output() selectedChange = new EventEmitter<{ user_id: number; name: string }[]>();

  searchText = '';

  constructor(private cdr: ChangeDetectorRef) {}

  get filteredUsers(): any[] {
    const search = this.searchText.toLowerCase();
    const selectedIds = new Set(this.selected.map(m => m.user_id));
    return this.users.filter(u => !selectedIds.has(u.id) && (u.name?.toLowerCase().includes(search) || u.email?.toLowerCase().includes(search)));
  }

  onAdd(user: any): void {
    if (!this.selected.some(m => m.user_id === user.id)) {
      this.selected = [...this.selected, { user_id: user.id, name: user.name }];
      this.selectedChange.emit(this.selected);
    }
    this.searchText = '';
    this.cdr.detectChanges();
  }

  onRemove(member: any): void {
    this.selected = this.selected.filter(m => m.user_id !== member.user_id);
    this.selectedChange.emit(this.selected);
    this.cdr.detectChanges();
  }
}
