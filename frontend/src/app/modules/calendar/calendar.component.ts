import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {
  currentDate = new Date();
  events: any[] = [];
  calendarDays: any[] = [];
  loading = false;
  selectedDay: any = null;

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.buildCalendar(); this.loadEvents(); }

  buildCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const days: any[] = [];
    for (let i = 0; i < startPad; i++) {
      const d = new Date(year, month, -startPad + i + 1);
      days.push({ date: d, currentMonth: false, events: [] });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      days.push({ date, currentMonth: true, events: [], isToday: this.isToday(date) });
    }
    while (days.length < 42) {
      const d = new Date(year, month + 1, days.length - lastDay.getDate() - startPad + 1);
      days.push({ date: d, currentMonth: false, events: [] });
    }
    this.calendarDays = days;
    this.distributeEvents();
  }

  loadEvents(): void {
    this.loading = true;
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const start = new Date(year, month, 1).toISOString().split('T')[0];
    const end = new Date(year, month + 1, 0).toISOString().split('T')[0];
    this.http.get<any[]>('/api/calendar/events', { params: { start, end } }).subscribe({
      next: r => { this.events = r; this.distributeEvents(); this.loading = false; this.cdr.detectChanges(); },
      error: () => this.loading = false
    });
  }

  distributeEvents(): void {
    this.calendarDays.forEach(day => day.events = []);
    this.events.forEach(ev => {
      const evDate = new Date(ev.date).toDateString();
      const day = this.calendarDays.find(d => d.date.toDateString() === evDate);
      if (day) day.events.push(ev);
    });
  }

  prevMonth(): void { this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1); this.buildCalendar(); this.loadEvents(); }
  nextMonth(): void { this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1); this.buildCalendar(); this.loadEvents(); }
  isToday(d: Date): boolean { const t = new Date(); return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear(); }
  selectDay(day: any): void { this.selectedDay = this.selectedDay?.date.toDateString() === day.date.toDateString() ? null : day; }
  openEvent(ev: any): void { this.router.navigate([`/${ev.type}s`, ev.id]); }
  get monthYear(): string { return this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); }
}
