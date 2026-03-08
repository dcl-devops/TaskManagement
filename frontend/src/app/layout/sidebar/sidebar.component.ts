import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

interface NavItem {
  label: string;
  icon: string;
  path: string;
  adminOnly?: boolean;
}

@Component({
  standalone: false,
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Input() mobileOpen = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: '◼', path: '/dashboard' },
    { label: 'Tasks', icon: '✓', path: '/tasks' },
    { label: 'Meetings', icon: '◆', path: '/meetings' },
    { label: 'Projects', icon: '▲', path: '/projects' },
    { label: 'Calendar', icon: '▦', path: '/calendar' },
    { label: 'Reports', icon: '▬', path: '/reports' },
    { label: 'Admin', icon: '⚙', path: '/admin', adminOnly: true }
  ];

  constructor(public auth: AuthService, public router: Router) {}

  get visibleItems(): NavItem[] {
    return this.navItems.filter(item => !item.adminOnly || this.auth.isAdmin());
  }

  isActive(path: string): boolean {
    return this.router.url.startsWith(path);
  }

  getUserInitials(): string {
    const name = this.auth.currentUser?.name || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
