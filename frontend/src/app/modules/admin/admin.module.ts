import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { UsersComponent } from './users/users.component';
import { MasterDataComponent } from './master-data/master-data.component';
import { GeographyMasterComponent } from './geography/geography-master.component';

const routes: Routes = [
  { path: '', component: AdminDashboardComponent },
  { path: 'users', component: UsersComponent },
  { path: 'master-data', component: MasterDataComponent },
  { path: 'geography', component: GeographyMasterComponent }
];

@NgModule({
  declarations: [AdminDashboardComponent, UsersComponent, MasterDataComponent, GeographyMasterComponent],
  imports: [CommonModule, SharedModule, FormsModule, ReactiveFormsModule, RouterModule.forChild(routes)]
})
export class AdminModule {}
