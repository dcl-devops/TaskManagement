import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private isDark = new BehaviorSubject<boolean>(false);
  isDark$ = this.isDark.asObservable();

  init(): void {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = saved === 'dark' || (!saved && prefersDark);
    this.setDark(dark);
  }

  toggle(): void { this.setDark(!this.isDark.value); }

  setDark(value: boolean): void {
    this.isDark.next(value);
    document.body.classList.toggle('dark-theme', value);
    localStorage.setItem('theme', value ? 'dark' : 'light');
  }

  get currentTheme(): string { return this.isDark.value ? 'dark' : 'light'; }
}
