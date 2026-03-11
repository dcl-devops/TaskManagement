# TaskFlow - Enterprise SaaS Task Management Platform

## Tech Stack
- **Frontend:** Angular 21 (port 3000, production build)
- **Backend:** Node.js/Express (port 8002) behind FastAPI proxy (port 8001)
- **Database:** PostgreSQL 15
- **Charts:** Chart.js 4.5.1 + ng2-charts 10

## Implemented Features

### Customer Entity (Mar 11, 2026)
- [x] Full CRUD for Customers (Code, Name, Address, City, State, Country, Industry, Contact Person, Mobile, Email, Status)
- [x] Customer list with search, status filter, industry filter, project count
- [x] Customer detail page showing linked Projects, Meetings, Tasks
- [x] Customers integrated into Projects (customer_id dropdown in form)
- [x] Customer name displayed on Project cards
- [x] Customer-based hierarchical filtering on Projects, Meetings, Tasks pages
- [x] Sidebar "Customers" navigation item

### Project Detail Tabs (Mar 11, 2026)
- [x] Redesigned with tabbed layout: Updates, Meetings, Tasks
- [x] Inline update posting from Updates tab
- [x] Customer info shown in project detail sidebar

### Admin User Management Enhancements (Mar 11, 2026)
- [x] Email field editable when editing a user (with uniqueness validation)
- [x] Reset Password integrated into user edit modal (inline)

### Shared Member Search Component (Mar 11, 2026)
- [x] Reusable `app-member-search` component in SharedModule
- [x] Used in both Project Form and Meeting Form
- [x] Type-to-search with avatar display, chip-based selection

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
- [x] Pinned task click -> task detail page
- [x] Active/Open counts in large font

### Projects
- [x] Sort by: Created Date, Start Date, Name, Code, Priority
- [x] Filter by: Owner, Priority, Status, Customer
- [x] Cards show meeting/task summary + customer name
- [x] Detail shows all tasks including from linked meetings (tabbed UI)
- [x] Owner auto-fills department/location

### Meetings
- [x] Cards show task summary
- [x] Owner auto-fills location
- [x] Customer filter on meeting list

### Auth
- [x] Signup auto-creates first company with org name
- [x] Super Admin panel with separate auth

### Other
- [x] Full Task/Project/Meeting CRUD
- [x] Admin (Users, Companies, Locations, Departments, Designations)
- [x] Notifications, Calendar, Reports, Avatar system, Dark/Light theme

## Remaining Tasks
- [ ] Deploy to Digital Ocean (persistent DB) (P2)
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

## Key DB Tables
- **customers:** id, org_id, customer_code, name, address, city, state, country, industry, contact_person, mobile, email, status, created_by
- **projects:** added customer_id (FK to customers.id)
- **tasks:** has is_pinned boolean
- **users:** uniqueness on email, mobile (per org), employee_code (per org); is_superadmin flag
