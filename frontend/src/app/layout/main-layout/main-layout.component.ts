import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  standalone: false,
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit {
  sidebarCollapsed = false;
  sidebarMobileOpen = false;

  constructor(public auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (this.auth.currentUser?.force_password_change) {
      this.router.navigate(['/auth/change-password']);
    }
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.sidebarMobileOpen = false;
    });
  }

  toggleSidebar(): void { this.sidebarCollapsed = !this.sidebarCollapsed; }
  toggleMobileSidebar(): void { this.sidebarMobileOpen = !this.sidebarMobileOpen; }
}
