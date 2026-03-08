import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warn' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toasts = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toasts.asObservable();

  show(message: string, type: Toast['type'] = 'info', duration = 3500): void {
    const id = Math.random().toString(36).slice(2);
    this.toasts.next([...this.toasts.value, { id, message, type }]);
    setTimeout(() => this.remove(id), duration);
  }

  success(msg: string): void { this.show(msg, 'success'); }
  error(msg: string): void { this.show(msg, 'error'); }
  warn(msg: string): void { this.show(msg, 'warn'); }

  remove(id: string): void {
    this.toasts.next(this.toasts.value.filter(t => t.id !== id));
  }
}
