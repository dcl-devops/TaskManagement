import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CalendarComponent } from './calendar.component';

const routes: Routes = [{ path: '', component: CalendarComponent }];

@NgModule({
  declarations: [CalendarComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes)]
})
export class CalendarModule {}
