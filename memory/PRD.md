# TaskFlow - Enterprise SaaS Task Management Platform

## Original Problem Statement
Build a professional, enterprise-grade, multi-tenant SaaS Task Management Web Application that is easy to use, clean, fast, and hierarchical, allowing leaders to monitor work across reporting structures.

## Tech Stack
- **Frontend:** Angular 21 (port 3000, production build)
- **Backend:** Node.js/Express (port 8002) behind FastAPI proxy (port 8001)
- **Database:** PostgreSQL 15
- **Charts:** Chart.js 4.5.1 + ng2-charts 10
- **Architecture:** Multi-tenant SaaS with RBAC

## User Decisions
- Rejected React/Python/MongoDB in favor of Angular/Node.js/PostgreSQL for PowerBI integration
- Skip OTP verification for initial build
- Defer WhatsApp notifications

## Implemented Features

### Dashboard (Redesigned Mar 10, 2026)
- [x] 6 stat cards: Projects (Total+Active), Meetings (Total+Open), Open Tasks, Due/Overdue, Task Trend line graph, Meeting Trend line graph
- [x] Year filter replacing organization name
- [x] Compact Tasks by Priority and Tasks by Status cards
- [x] Pinned Tasks table (replacing Recent Open Tasks)
- [x] Team Workload + Today's Meetings side by side

### Task Management (Enhanced Mar 10, 2026)
- [x] Removed Department column, added Overdue Days column
- [x] Group/Ungroup subtasks toggle with localStorage persistence
- [x] Sort order persistence in localStorage
- [x] Task detail: Project/Meeting names as clickable links
- [x] Add Subtask auto-fills category, parent task, and shows Project/Meeting context

### Project Management (Enhanced Mar 10, 2026)
- [x] Project cards show meeting/task summary (Total, Completed, Pending for both)
- [x] Project detail lists ALL tasks including tasks from project's meetings
- [x] Progress percentage includes all related tasks

### Meeting Management (Enhanced Mar 10, 2026)
- [x] Meeting cards show task summary (Total, Completed, Pending)

### Previously Completed
- [x] Organization Signup & User Management (owner, admin, manager, user roles)
- [x] Secure Login (JWT, password hashing)
- [x] Full Task CRUD (standalone, subtasks, linked to meetings/projects)
- [x] Task Details (Comments, Attachments, Activity Log, Subtasks)
- [x] Full Meeting CRUD (MOM, Action Items, Members, Updates)
- [x] Full Project CRUD (Overview, Tasks, Timeline, Progress)
- [x] Admin Module (Users, Companies, Locations, Departments, Designations)
- [x] RBAC middleware
- [x] In-app Notifications
- [x] Calendar View (Tasks + Meetings)
- [x] Reports module
- [x] Super Admin Panel (platform analytics, org management)
- [x] Avatar system
- [x] Dark/Light theme

### Bug Fixes (Mar 9-10, 2026)
- [x] Fixed meeting/project creation via [ngValue] fix for select elements
- [x] Fixed infinite loading via error handlers with cdr.detectChanges()
- [x] Fixed super admin auth interceptor conflict
- [x] Added cleanInt() backend sanitizer for integer fields
- [x] Created DB migration folder for Digital Ocean deployment

## Remaining/Future Tasks
- [ ] Refactor type-to-search member selection into reusable shared component (P1)
- [ ] Improve date pickers with better library (P2)
- [ ] Email Notifications (P2)
- [ ] PowerBI integration readiness (P2)
- [ ] WhatsApp notifications (P3)
- [ ] Advanced reporting & analytics (P3)
- [ ] Export reports to Excel (P3)
- [ ] Deployment to persistent environment (P2)

## API Endpoints
- `/api/auth/*` - signup, login, change-password, me
- `/api/dashboard/stats?year=YYYY` - Dashboard with trends, pinned tasks, today meetings
- `/api/tasks/*` - CRUD, pin, comments, attachments, activities
- `/api/meetings/*` - CRUD with task counts, updates, MOM, members
- `/api/projects/*` - CRUD with meeting/task counts, all_tasks in detail
- `/api/admin/*` - users, companies, locations, departments, designations
- `/api/notifications/*` - list, unread-count, mark-read
- `/api/calendar/events` - tasks + meetings in date range
- `/api/reports/*` - overdue-tasks, task-aging, user-productivity, department-performance, project-progress
- `/api/superadmin/*` - dashboard, organizations CRUD

## Test Credentials
- Admin: admin@democorp.com / Admin@123 (role: owner)
- Super Admin: superadmin@taskflow.com / SuperAdmin@123

## Database
PostgreSQL 15 on localhost:5432
- DB: taskmanagement, User: taskadmin, Pass: taskpass123
- Migration files: /nodebackend/db/migrations/
- NOTE: PostgreSQL is NOT persistent in preview env

## Architecture
- FastAPI proxy (8001) → Node.js (8002) → PostgreSQL (5432)
- Angular production build served by Express (3000)
- Kubernetes ingress: /api/* → 8001, everything else → 3000
