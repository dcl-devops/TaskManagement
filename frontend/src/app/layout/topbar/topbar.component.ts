import { Component, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ThemeService } from '../../core/theme.service';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent implements OnInit, OnDestroy {
  @Output() toggleMobileSidebar = new EventEmitter<void>();
  isDark = false;
  unreadCount = 0;
  notifications: any[] = [];
  showNotifications = false;
  showUserMenu = false;
  searchQuery = '';
  private sub!: Subscription;

  constructor(
    public auth: AuthService,
    private theme: ThemeService,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.theme.isDark$.subscribe(v => this.isDark = v);
    this.auth.currentUser$.subscribe(() => this.cdr.detectChanges());
    this.loadNotifications();
    this.sub = interval(30000).subscribe(() => this.loadNotifications());
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  loadNotifications(): void {
    this.http.get<any>('/api/notifications/unread-count').subscribe({
      next: r => { this.unreadCount = r.count; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    this.showUserMenu = false;
    if (this.showNotifications) {
      this.http.get<any[]>('/api/notifications').subscribe({
        next: r => { this.notifications = r; this.cdr.detectChanges(); },
        error: () => {}
      });
    }
  }

  markAllRead(): void {
    this.http.patch('/api/notifications/read-all', {}).subscribe(() => {
      this.unreadCount = 0;
      this.notifications.forEach(n => n.is_read = true);
      this.cdr.detectChanges();
    });
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    this.showNotifications = false;
  }

  toggleTheme(): void { this.theme.toggle(); }
  logout(): void { this.auth.logout(); }

  getUserInitials(): string {
    const name = this.auth.currentUser?.name || '';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  uploadSelfAvatar(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.auth.currentUser) return;
    const formData = new FormData();
    formData.append('avatar', input.files[0]);
    this.http.post<any>(`/api/admin/users/${this.auth.currentUser.id}/avatar`, formData).subscribe({
      next: () => { this.auth.refreshMe(); this.cdr.detectChanges(); },
      error: () => {}
    });
    input.value = '';
  }

  closeDropdowns(): void {
    this.showNotifications = false;
    this.showUserMenu = false;
  }
}
