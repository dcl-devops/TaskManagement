import { Component } from '@angular/core';
import { ThemeService } from './core/theme.service';

@Component({
  standalone: false,
  selector: 'app-root',
  template: '<router-outlet></router-outlet>'
})
export class AppComponent {
  constructor(private themeService: ThemeService) {
    this.themeService.init();
  }
}
