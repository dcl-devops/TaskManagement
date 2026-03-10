import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-project-detail',
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss']
})
export class ProjectDetailComponent implements OnInit {
  project: any = null;
  updates: any[] = [];
  loading = true;

  constructor(
    private http: HttpClient, private route: ActivatedRoute,
    private router: Router, private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.http.get<any>(`/api/projects/${id}`).subscribe({
      next: p => { this.project = p; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
    this.http.get<any[]>(`/api/projects/${id}/updates`).subscribe({
      next: r => { this.updates = r; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  getStatusClass(s: string): string {
    const m: any = { open: 'badge-open', in_progress: 'badge-in_progress', on_hold: 'badge-on_hold', resolved: 'badge-resolved', closed: 'badge-closed', active: 'badge-open', completed: 'badge-resolved', cancelled: 'badge-closed' };
    return m[s] || '';
  }

  getPriorityClass(p: string): string { return 'badge-' + p; }

  formatDate(d: string): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getInitials(name: string): string {
    return (name || '').split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2);
  }
}
