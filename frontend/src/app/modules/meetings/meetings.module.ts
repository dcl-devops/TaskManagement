import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MeetingListComponent } from './meeting-list/meeting-list.component';
import { MeetingFormComponent } from './meeting-form/meeting-form.component';
import { MeetingDetailComponent } from './meeting-detail/meeting-detail.component';

const routes: Routes = [
  { path: '', component: MeetingListComponent },
  { path: 'new', component: MeetingFormComponent },
  { path: ':id', component: MeetingDetailComponent },
  { path: ':id/edit', component: MeetingFormComponent }
];

@NgModule({
  declarations: [MeetingListComponent, MeetingFormComponent, MeetingDetailComponent],
  imports: [CommonModule, SharedModule, FormsModule, ReactiveFormsModule, RouterModule.forChild(routes)]
})
export class MeetingsModule {}
