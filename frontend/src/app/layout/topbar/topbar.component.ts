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
  showSearchResults = false;
  searchResults: any[] = [];
  searching = false;
  private searchTimeout: any;
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

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    if (this.searchQuery.length < 2) { this.showSearchResults = false; this.searchResults = []; return; }
    this.searching = true;
    this.searchTimeout = setTimeout(() => {
      const q = this.searchQuery.toLowerCase();
      const results: any[] = [];
      // Search tasks
      this.http.get<any[]>('/api/tasks', { params: { search: this.searchQuery } }).subscribe({
        next: tasks => {
          tasks.slice(0, 5).forEach(t => results.push({ type: 'Task', title: t.title, meta: t.task_number, route: ['/tasks', t.id] }));
          // Search projects
          this.http.get<any[]>('/api/projects', { params: { search: this.searchQuery } }).subscribe({
            next: projects => {
              projects.slice(0, 5).forEach(p => results.push({ type: 'Project', title: p.title, meta: p.project_number, route: ['/projects', p.id] }));
              // Search meetings
              this.http.get<any[]>('/api/meetings', { params: { search: this.searchQuery } }).subscribe({
                next: meetings => {
                  meetings.slice(0, 5).forEach(m => results.push({ type: 'Meeting', title: m.title, meta: m.meeting_number, route: ['/meetings', m.id] }));
                  this.searchResults = results;
                  this.showSearchResults = true;
                  this.searching = false;
                  this.cdr.detectChanges();
                }
              });
            }
          });
        }
      });
    }, 300);
  }

  goToResult(result: any): void {
    this.showSearchResults = false;
    this.searchQuery = '';
    this.router.navigate(result.route);
  }

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
    this.showSearchResults = false;
  }
}
