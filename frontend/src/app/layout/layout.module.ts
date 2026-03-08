import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MainLayoutComponent } from './main-layout/main-layout.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopbarComponent } from './topbar/topbar.component';
import { ToastComponent } from '../shared/components/toast.component';

const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'dashboard', loadChildren: () => import('../modules/dashboard/dashboard.module').then(m => m.DashboardModule) },
      { path: 'tasks', loadChildren: () => import('../modules/tasks/tasks.module').then(m => m.TasksModule) },
      { path: 'meetings', loadChildren: () => import('../modules/meetings/meetings.module').then(m => m.MeetingsModule) },
      { path: 'projects', loadChildren: () => import('../modules/projects/projects.module').then(m => m.ProjectsModule) },
      { path: 'calendar', loadChildren: () => import('../modules/calendar/calendar.module').then(m => m.CalendarModule) },
      { path: 'reports', loadChildren: () => import('../modules/reports/reports.module').then(m => m.ReportsModule) },
      { path: 'admin', loadChildren: () => import('../modules/admin/admin.module').then(m => m.AdminModule) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  declarations: [MainLayoutComponent, SidebarComponent, TopbarComponent, ToastComponent],
  imports: [CommonModule, SharedModule, FormsModule, ReactiveFormsModule, RouterModule.forChild(routes)]
})
export class LayoutModule {}
