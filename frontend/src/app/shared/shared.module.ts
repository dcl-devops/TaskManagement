import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormatLabelPipe } from './pipes/format-label.pipe';

@NgModule({
  declarations: [FormatLabelPipe],
  imports: [CommonModule],
  exports: [FormatLabelPipe]
})
export class SharedModule {}
