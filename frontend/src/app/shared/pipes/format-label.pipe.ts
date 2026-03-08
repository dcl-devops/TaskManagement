import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: false,
  name: 'formatLabel'
})
export class FormatLabelPipe implements PipeTransform {
  transform(value: string | null | undefined): string;
  transform(value: unknown): string {
    if (!value || typeof value !== 'string') return '';
    if (value === 'closed') return 'Completed';
    return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}
