# TaskFlow - Enterprise SaaS Task Management Platform

## Tech Stack
- **Frontend:** Angular 21 (port 3000, production build)
- **Backend:** Node.js/Express (port 8002) behind FastAPI proxy (port 8001)
- **Database:** PostgreSQL 15
- **Charts:** Chart.js 4.5.1 + ng2-charts 10

## Implemented Features

### User Validation (Mar 10, 2026)
- [x] Email uniqueness across system (409 on duplicate)
- [x] Mobile number uniqueness within organization (409 on duplicate)
- [x] Employee code uniqueness within organization (409 on duplicate)
- [x] Validation on both CREATE and UPDATE user

### RBAC Visibility (Mar 10, 2026)
- [x] Tasks: visible if user is creator, assigned_to, assigned_by, or member of related project/meeting
- [x] Projects: visible if user is owner, creator, or member
- [x] Meetings: visible if user is owner, creator, or member
- [x] Admin/Owner role: full org-wide visibility retained

### Task Management Enhancements (Mar 10, 2026)
- [x] Project filter includes tasks from meetings linked to that project
- [x] Toggle switch (not checkbox) for Group Sub-tasks, single line display
- [x] Task count badge displayed near "Task Management" title
- [x] Search with Group Sub-tasks ON shows matching subtasks as orphan entries

### Dashboard
- [x] 6 stat cards with charts (no legends), Year filter
- [x] Pinned task click → task detail page
- [x] Active/Open counts in large font

### Projects
- [x] Sort by: Created Date, Start Date, Name, Code, Priority
- [x] Filter by: Owner, Priority, Status
- [x] Cards show meeting/task summary
- [x] Detail shows all tasks including from linked meetings
- [x] Owner auto-fills department/location

### Meetings
- [x] Cards show task summary
- [x] Owner auto-fills location

### Auth
- [x] Signup auto-creates first company with org name
- [x] Super Admin panel with separate auth

### Other
- [x] Full Task/Project/Meeting CRUD
- [x] Admin (Users, Companies, Locations, Departments, Designations)
- [x] Notifications, Calendar, Reports, Avatar system, Dark/Light theme

## Remaining Tasks
- [ ] Refactor member selection into reusable component (P1)
- [ ] Better date pickers (P2)
- [ ] Email Notifications (P2)
- [ ] PowerBI integration (P2)
- [ ] WhatsApp notifications (P3)
- [ ] Advanced reporting (P3)
- [ ] Export to Excel (P3)

## Credentials
- Admin: admin@democorp.com / Admin@123
- Super Admin: superadmin@taskflow.com / SuperAdmin@123
- DB: taskmanagement / taskadmin / taskpass123
