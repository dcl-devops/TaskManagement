# TaskFlow - Enterprise SaaS Task Management Platform

## Original Problem Statement
Build a professional, enterprise-grade, multi-tenant SaaS Task Management Web Application that is easy to use, clean, fast, and hierarchical, allowing leaders to monitor work across reporting structures.

## Tech Stack
- **Frontend:** Angular 21 (port 3000, production build)
- **Backend:** Node.js/Express (port 8002) behind FastAPI proxy (port 8001)
- **Database:** PostgreSQL 15
- **Architecture:** Multi-tenant SaaS with RBAC

## User Decisions
- Rejected React/Python/MongoDB in favor of Angular/Node.js/PostgreSQL for PowerBI integration
- Skip OTP verification for initial build
- Defer WhatsApp notifications
- Build complete MVP in one go

## Core Modules & Status

### Implemented (P0 - Complete)
- [x] Organization Signup & User Management (owner, admin, manager, user roles)
- [x] Secure Login (JWT, password hashing, change password)
- [x] Dashboard (My Tasks, Team Tasks, Overdue, Priority/Status breakdown, Recent Tasks, Team Workload)
- [x] Task Management CRUD (standalone, subtasks, linked to meetings/projects, filters, search, pin)
- [x] Task Details (Comments, Attachments, Activity Log, Subtasks)
- [x] Meetings Module (CRUD, MOM, Action Items, Members, Updates)
- [x] Projects Module (CRUD, Overview, Tasks, Progress tracking, Members)
- [x] Admin Module (User Management, Master Data: Companies, Locations, Departments, Designations)
- [x] RBAC middleware (owner/admin see all, manager sees team, user sees own)
- [x] In-app Notifications
- [x] Calendar View (Tasks + Meetings)
- [x] Reports (Overdue tasks, Task Aging, User Productivity, Department Performance, Project Progress)
- [x] Super Admin Panel (Platform analytics, Organization management)

### Bug Fixes (Mar 9, 2026)
- [x] Fixed meeting creation failing due to [value]="null" sending string "null" to backend
- [x] Fixed project creation - projects now appear in list without page refresh
- [x] Fixed project detail infinite loading - added error handlers
- [x] Fixed slow loading across all screens - added cdr.detectChanges() in error handlers
- [x] Added cleanInt() backend sanitizer for robust integer field handling

### Remaining/Future (P2)
- [ ] Email Notifications
- [ ] Advanced filters saving & column customization
- [ ] Rich text editor for task/meeting descriptions
- [ ] Export reports to Excel
- [ ] User Profile management with avatar upload improvements
- [ ] WhatsApp notifications (deferred)
- [ ] PowerBI integration readiness
- [ ] Refactor type-to-search member selection into reusable shared component
- [ ] Improve date pickers with better library

## API Endpoints
- `/api/auth/*` - signup, login, change-password, me
- `/api/tasks/*` - CRUD, pin, comments, attachments, activities
- `/api/meetings/*` - CRUD, updates, MOM, members
- `/api/projects/*` - CRUD, updates, members
- `/api/dashboard/*` - stats, team-workload
- `/api/admin/*` - users, companies, locations, departments, designations
- `/api/notifications/*` - list, unread-count, mark-read
- `/api/calendar/events` - tasks + meetings in date range
- `/api/reports/*` - overdue-tasks, task-aging, user-productivity, department-performance, project-progress
- `/api/superadmin/*` - dashboard, organizations CRUD

## Test Credentials
- Admin: admin@democorp.com / Admin@123 (role: owner)
- Super Admin: superadmin@taskflow.com / SuperAdmin@123
- Org: Demo Corp

## Database
PostgreSQL 15 on localhost:5432
- DB: taskmanagement, User: taskadmin, Pass: taskpass123
- NOTE: PostgreSQL is NOT persistent in preview env - may need re-init on restart

## Architecture Notes
- FastAPI proxy on port 8001 starts PostgreSQL and Node.js as subprocess
- Node.js Express on port 8002
- Angular 21 production build served by Express static server on port 3000
- Kubernetes ingress routes /api/* to 8001, everything else to 3000
