import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { SuperAdminLoginComponent } from './login.component';
import { SuperAdminDashboardComponent } from './dashboard.component';
import { SuperAdminOrgDetailComponent } from './org-detail.component';

const routes: Routes = [
  { path: 'login', component: SuperAdminLoginComponent },
  { path: 'dashboard', component: SuperAdminDashboardComponent },
  { path: 'organizations/:id', component: SuperAdminOrgDetailComponent },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];

@NgModule({
  declarations: [SuperAdminLoginComponent, SuperAdminDashboardComponent, SuperAdminOrgDetailComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedModule, RouterModule.forChild(routes)]
})
export class SuperAdminModule {}
