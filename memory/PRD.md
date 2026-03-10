# TaskFlow - Enterprise SaaS Task Management Platform

## Original Problem Statement
Build a professional, enterprise-grade, multi-tenant SaaS Task Management Web Application that is easy to use, clean, fast, and hierarchical, allowing leaders to monitor work across reporting structures.

## Tech Stack
- **Frontend:** Angular 21 (port 3000, production build)
- **Backend:** Node.js/Express (port 8002) behind FastAPI proxy (port 8001)
- **Database:** PostgreSQL 15
- **Charts:** Chart.js 4.5.1 + ng2-charts 10
- **Architecture:** Multi-tenant SaaS with RBAC

## Implemented Features

### Dashboard (Latest: Mar 10, 2026)
- [x] 6 stat cards: Active Projects (large), Open Meetings (large), Open Tasks, Due/Overdue, Task Trend (no legend), Meeting Trend (no legend)
- [x] Year filter
- [x] Compact Priority & Status cards
- [x] Pinned Tasks → clicking opens task detail (not list)
- [x] Team Workload + Today's Meetings side by side

### Task Management
- [x] Overdue Days column (replaces Department)
- [x] Group/Ungroup subtasks toggle with localStorage persistence
- [x] Sort order persistence
- [x] Task detail: Project/Meeting names as clickable links
- [x] Task shows meeting's project context (meeting_project_title)
- [x] Add Subtask auto-fills category, parent, shows Project/Meeting context

### Project Management
- [x] Project cards: meeting/task summary (Total, Completed, Pending)
- [x] Project detail: ALL tasks including from linked meetings
- [x] Sort by: Created Date, Start Date, Name, Code, Priority
- [x] Filter by: Owner, Priority, Status
- [x] Owner selection auto-fills department/location

### Meeting Management
- [x] Meeting cards: task summary (Total, Completed, Pending)
- [x] Owner selection auto-fills location

### Auth & Masters
- [x] Signup auto-creates first company with org name
- [x] JWT auth, password hashing
- [x] Super Admin panel with separate auth

### Other Modules
- [x] Admin (Users, Companies, Locations, Departments, Designations)
- [x] RBAC middleware, Notifications, Calendar, Reports
- [x] Avatar system, Dark/Light theme

## DB Migrations
- `/nodebackend/db/migrations/001_add_columns.sql` - organizations.status, meetings.project_id, users.is_superadmin

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
