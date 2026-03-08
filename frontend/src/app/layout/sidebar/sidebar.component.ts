import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Subscription } from 'rxjs';

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
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() collapsed = false;
  @Input() mobileOpen = false;
  @Output() toggleCollapse = new EventEmitter<void>();
  private sub!: Subscription;

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: '◼', path: '/dashboard' },
    { label: 'Tasks', icon: '✓', path: '/tasks' },
    { label: 'Meetings', icon: '◆', path: '/meetings' },
    { label: 'Projects', icon: '▲', path: '/projects' },
    { label: 'Calendar', icon: '▦', path: '/calendar' },
    { label: 'Reports', icon: '▬', path: '/reports' },
    { label: 'Admin', icon: '⚙', path: '/admin', adminOnly: true }
  ];

  constructor(public auth: AuthService, public router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.sub = this.auth.currentUser$.subscribe(() => this.cdr.detectChanges());
  }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }

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
