# TaskFlow - Enterprise SaaS Task Management Platform

## Tech Stack
- **Frontend:** Angular 21 (port 3000, production build)
- **Backend:** Node.js/Express (port 8002) behind FastAPI proxy (port 8001)
- **Database:** PostgreSQL 15
- **Charts:** Chart.js 4.5.1 + ng2-charts 10

## Implemented Features

### Geography Master Data (Mar 11, 2026 - Session 2)
- [x] Countries, States, Cities tables with API (CRUD + search)
- [x] Seeded: 166 countries, 36 Indian states/UTs, 207 Indian cities
- [x] Geography Master admin screen with 3 tabs, search, add/edit/delete
- [x] Cascading add: City form requires State selection, State requires Country

### Customer Form Autocomplete (Mar 11, 2026 - Session 2)
- [x] City field: Autocomplete search against cities master
- [x] Selecting city auto-fills State and Country fields
- [x] State field: Autocomplete search against states master
- [x] Selecting state auto-fills Country
- [x] Country field: Autocomplete search against countries master

### Cascading/Dependent Filters (Mar 11, 2026 - Session 2)
- [x] Task list: Customer → narrows Projects & Meetings; Project → narrows Meetings & Customers; Meeting → narrows Projects & Customers
- [x] Project list: Customer ↔ Owner cross-filter
- [x] Meeting list: Customer ↔ Project cross-filter

### UI Fixes (Mar 11, 2026 - Session 2)
- [x] Project card: Owner & Customer in 2 rows (not columns)
- [x] Member chip color: Purple → Light Blue (#dbeafe/#2563eb)
- [x] Removed "+ New Task" button from top ribbon
- [x] Fixed global search: Now searches tasks, projects, meetings with dropdown results

### Customer Entity (Mar 11, 2026 - Session 1)
- [x] Full CRUD (Code, Name, Address, City, State, Country, Industry, Contact, Mobile, Email, Status)
- [x] Customer list with search, status filter, industry filter, project count
- [x] Customer detail page showing linked Projects, Meetings, Tasks
- [x] Customers integrated into Projects (customer_id dropdown)
- [x] Customer-based hierarchical filtering on Projects, Meetings, Tasks
- [x] Sidebar "Customers" nav item

### Project Detail Tabs (Mar 11, 2026 - Session 1)
- [x] Tabbed layout: Updates, Meetings, Tasks
- [x] Inline update posting from Updates tab

### Admin User Management (Mar 11, 2026 - Session 1)
- [x] Email field editable in user edit modal
- [x] Reset Password integrated into user edit modal

### Shared Components (Mar 11, 2026 - Session 1)
- [x] Reusable `app-member-search` component (Project + Meeting forms)

### Earlier Features
- [x] Dashboard with 6 stat cards, charts, pinned tasks, year filter
- [x] Full Task/Project/Meeting/Calendar/Reports CRUD
- [x] RBAC: Scoped visibility per user role
- [x] Uniqueness validation: email, mobile, employee code
- [x] Task enhancements: group subtasks toggle, overdue days, task count
- [x] Admin: Users, Companies, Locations, Departments, Designations
- [x] Auto-fill department/location on owner selection
- [x] Auth: Signup auto-creates company, Super Admin panel

## Remaining Tasks
- [ ] Deploy to Digital Ocean (persistent DB) (P2)
- [ ] PowerBI integration (P2)
- [ ] WhatsApp notifications (P3)
- [ ] Advanced reporting & analytics (P3)
- [ ] Export to Excel (P3)

## Credentials
- Admin: admin@democorp.com / Admin@123
- Super Admin: superadmin@taskflow.com / SuperAdmin@123
- DB: taskmanagement / taskadmin / taskpass123

## Key DB Tables
- **countries:** id, name, code
- **states:** id, name, country_id (FK)
- **cities:** id, name, state_id (FK) — includes state_name and country_name in API response
- **customers:** id, org_id, customer_code, name, address, city, state, country, industry, contact_person, mobile, email, status
- **projects:** includes customer_id (FK to customers.id)
- **tasks:** has is_pinned boolean
- **users:** uniqueness on email, mobile (per org), employee_code (per org)
