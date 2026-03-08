import { Component, OnInit } from '@angular/core';
import { ToastService, Toast } from '../../core/toast.service';

@Component({
  standalone: false,
  selector: 'app-toast',
  template: `
    <div class="toast-container">
      <div class="toast" *ngFor="let t of toasts" [class]="'toast toast-' + t.type">
        {{ t.message }}
        <button (click)="toastService.remove(t.id)" style="margin-left:auto;background:none;color:inherit;border:none;cursor:pointer;font-size:1rem;">&#10005;</button>
      </div>
    </div>
  `
})
export class ToastComponent implements OnInit {
  toasts: Toast[] = [];
  constructor(public toastService: ToastService) {}
  ngOnInit(): void { this.toastService.toasts$.subscribe(t => this.toasts = t); }
}
