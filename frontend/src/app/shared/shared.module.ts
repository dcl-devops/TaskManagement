import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormatLabelPipe } from './pipes/format-label.pipe';
import { MemberSearchComponent } from './components/member-search.component';

@NgModule({
  declarations: [FormatLabelPipe, MemberSearchComponent],
  imports: [CommonModule, FormsModule],
  exports: [FormatLabelPipe, MemberSearchComponent]
})
export class SharedModule {}
