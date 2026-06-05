# TaskFlow — Role-Based Task Management System

<div align="center">

![TaskFlow](https://img.shields.io/badge/TaskFlow-v1.0.0-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react)
![MySQL](https://img.shields.io/badge/MySQL-8.x-orange?style=for-the-badge&logo=mysql)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)

A full-stack, production-ready task management application with **role-based access control**, JWT authentication, real-time notifications, audit logging, and comprehensive reporting.

</div>

---

## Project Overview

TaskFlow is a role-based task management system built for teams. It enforces strict access control across three roles:

- **Admin** — Full system access: create users, projects, assign managers, view all audit logs and reports
- **Project Manager** — Manage their assigned projects and tasks, view team productivity
- **Employee** — View and update assigned tasks, submit work logs with time tracking

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite + TypeScript | SPA with fast HMR development |
| **Styling** | Tailwind CSS + shadcn/ui | Design system with dark theme |
| **State** | TanStack Query (React Query) | Server state caching & sync |
| **Backend** | Node.js 18 + Express 5 + TypeScript | REST API server |
| **ORM** | Prisma 6 | Type-safe database client |
| **Database** | MySQL 8 | Relational data storage |
| **Auth** | JWT (access + refresh tokens) | Stateless authentication |
| **Validation** | Zod | Runtime schema validation |
| **API Docs** | Swagger / OpenAPI 3.0 | Interactive API documentation |
| **Containerization** | Docker + Docker Compose | One-command deployment |

---

## Architecture Decisions

### Why Prisma?
Prisma provides full TypeScript type-safety for all database queries, automatic migration management, and an intuitive schema DSL. Compared to raw SQL or Sequelize, it eliminates an entire class of runtime type errors and makes schema changes safe and auditable.

### JWT Refresh Token Pattern
Access tokens are short-lived (15 minutes) to minimize exposure if intercepted. Refresh tokens (7 days) are stored in the `refresh_tokens` table and can be revoked server-side, enabling true logout and session invalidation — something not possible with stateless-only JWT.

### Feature-Based Service Layer
Business logic is isolated in `services/`, controllers only handle HTTP concerns (parsing request, calling service, sending response). This separation makes the code testable without HTTP and keeps controllers thin.

### Soft Deletes
Projects and tasks use `deletedAt` timestamps instead of hard deletes. This preserves historical data for audit logs and reporting while hiding deleted records from normal queries.

---

## Database Schema

```
┌─────────────────────────────────────────────────────────────────────┐
│  Model          │  Key Fields                │  Relations            │
├─────────────────┼────────────────────────────┼───────────────────────┤
│  User           │  id, name, email, role,    │  managedProjects,     │
│                 │  isActive, password         │  taskAssignments,     │
│                 │                             │  workLogs, auditLogs  │
├─────────────────┼────────────────────────────┼───────────────────────┤
│  Project        │  id, name, status,         │  manager (User),      │
│                 │  managerId, deletedAt       │  tasks                │
├─────────────────┼────────────────────────────┼───────────────────────┤
│  Task           │  id, name, priority,       │  project, assignments,│
│                 │  status, deadline,          │  workLogs             │
│                 │  deletedAt                  │                       │
├─────────────────┼────────────────────────────┼───────────────────────┤
│  TaskAssignment │  taskId, userId,           │  task, user           │
│                 │  assignedById               │                       │
├─────────────────┼────────────────────────────┼───────────────────────┤
│  WorkLog        │  id, description,          │  task, user, replies  │
│                 │  hoursWorked, attachmentUrl │                       │
├─────────────────┼────────────────────────────┼───────────────────────┤
│  LogReply       │  id, message, workLogId,   │  workLog, user        │
│                 │  userId                     │                       │
├─────────────────┼────────────────────────────┼───────────────────────┤
│  AuditLog       │  id, action, entity,       │  user                 │
│                 │  previousValue, newValue     │                       │
├─────────────────┼────────────────────────────┼───────────────────────┤
│  Notification   │  id, type, message,        │  user                 │
│                 │  isRead                     │                       │
├─────────────────┼────────────────────────────┼───────────────────────┤
│  RefreshToken   │  id, token, userId,        │  user                 │
│                 │  expiresAt                  │                       │
└─────────────────┴────────────────────────────┴───────────────────────┘
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0
- **MySQL** 8.x (or Docker)
- **Git**

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/role-based-task-management-system.git
cd role-based-task-management-system

# 2. Configure backend environment
cp backend/.env.example backend/.env
# Edit backend/.env and fill in your values (DATABASE_URL, JWT secrets, SMTP)

# 3. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 4. Run database migrations
cd ../backend
npx prisma migrate dev

# 5. Seed the database with demo data
npx prisma db seed

# 6. Start both servers (in separate terminals)
# Terminal 1 — Backend (http://localhost:5000)
cd backend && npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend && npm run dev
```

### Docker Setup

> Requires Docker Desktop installed and running.

```bash
# 1. Clone and navigate to root
git clone https://github.com/your-username/role-based-task-management-system.git
cd role-based-task-management-system

# 2. (Optional) Create a .env file in root to override defaults
# See docker-compose.yml for available variables

# 3. Build and start all services
docker-compose up --build

# App will be available at:
# Frontend: http://localhost
# Backend API: http://localhost:5000/api
# API Docs: http://localhost:5000/api-docs
```

To stop: `docker-compose down`  
To reset the database: `docker-compose down -v` (removes volumes)

---

## Demo Credentials

## Demo Credentials

The following demo accounts are available for testing different roles and permissions:

| Role | Name | Email |
|------|------|--------|
| **Admin** | System Admin | admin@demo.com |
| **Project Manager** | Rahul Sharma | rahul.pm@company.com |
| **Project Manager** | Priya Patel | priya.pm@company.com |
| **Project Manager** | Project Manager | pm@demo.com |
| **Employee** | Amit Verma | amit.emp@company.com |
| **Employee** | Sneha Joshi | sneha.emp@company.com |
| **Employee** | Employee One | emp1@demo.com |
| **Employee** | Employee Two | emp2@demo.com |

> Passwords can be configured through the database seed file or environment setup.
---

## API Documentation

Interactive Swagger UI is available at:

```
http://localhost:5000/api-docs
```

Raw OpenAPI JSON spec:
```
http://localhost:5000/api-docs.json
```

Or import `postman_collection.json` (in the project root) into Postman.

---

## Features Implemented

### Core Features
- ✅ **Authentication** — JWT login, logout, refresh tokens, forgot/reset password
- ✅ **Role-Based Access Control** — Admin, Project Manager, Employee roles with enforced permissions
- ✅ **User Management** — Admin can create, update, activate/deactivate users
- ✅ **Project Management** — CRUD with soft delete, status tracking (Planning/Active/Completed/Archived)
- ✅ **Task Management** — CRUD with priority, status, deadline, estimated hours
- ✅ **Task Assignment** — Assign/unassign employees; assignment history tracked
- ✅ **Work Logs** — Employees log hours with description and optional file attachment
- ✅ **Manager Replies** — Admin/PM can reply to work log entries
- ✅ **Role-Aware Dashboard** — Different stats per role (Admin/PM/Employee)
- ✅ **Reporting** — Overview, per-project, and per-employee reports

### Bonus Features
- ✅ **Audit Logging** — Every create/update/delete recorded with before/after values
- ✅ **Notifications** — In-app notifications for task assignments, deadline reminders
- ✅ **Deadline Checker** — Background cron job alerts employees before deadlines
- ✅ **Search & Filtering** — Tasks/projects filterable by status, priority, assignee, date
- ✅ **Pagination** — All list endpoints paginated with metadata
- ✅ **Soft Deletes** — Projects and tasks preserve history
- ✅ **Swagger/OpenAPI** — Full API documentation at `/api-docs`
- ✅ **Docker** — One-command deployment with `docker-compose up --build`
- ✅ **Rate Limiting** — Auth endpoints limited to 10 requests/minute
- ✅ **Compression** — HTTP response compression enabled
- ✅ **File Uploads** — Work log attachments stored with multer

---

## Assumptions

1. **Single assignee per task** — Each task has at most one assigned employee at a time. The `TaskAssignment` model supports multiple (for future use), but the UI enforces one.
2. **Soft deletes for projects and tasks** — Hard deletes would break audit log foreign keys. Soft delete via `deletedAt` is used instead.
3. **Project Manager scope** — PMs can only see/manage their own projects. They cannot create projects (Admin only).
4. **Email is optional** — SMTP config defaults to localhost. The system runs without a real mail server (password reset emails will fail silently).
5. **File uploads are local** — Attachments are stored in `backend/uploads/`. For production, replace with S3 or similar.

---

## Deployment

### Option A: Render (Backend) + Vercel (Frontend) + PlanetScale (DB)

#### 1. Database — PlanetScale
```bash
# Create a PlanetScale database named "taskmanagement"
# Copy the DATABASE_URL connection string
```

#### 2. Backend — Render
1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repo, set root directory to `backend`
3. Build command: `npm install && npx prisma generate && npm run build`
4. Start command: `npx prisma migrate deploy && node dist/index.js`
5. Add environment variables:
   ```
   DATABASE_URL=<PlanetScale connection string>
   JWT_ACCESS_SECRET=<random 64-char string>
   JWT_REFRESH_SECRET=<random 64-char string>
   FRONTEND_URL=https://your-app.vercel.app
   NODE_ENV=production
   ```

#### 3. Frontend — Vercel
1. Import repo on [Vercel](https://vercel.com)
2. Set root directory to `frontend`
3. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```
4. Deploy

### Option B: Docker Compose (VPS / DigitalOcean)
```bash
# SSH into your server
ssh user@your-server-ip

# Clone and deploy
git clone <repo-url>
cd role-based-task-management-system

# Set production secrets
cp .env.example .env
nano .env  # Edit MYSQL_ROOT_PASSWORD, JWT secrets, FRONTEND_URL

docker-compose up -d --build
```

---

## Project Structure

```
role-based-task-management-system/
├── backend/
│   ├── src/
│   │   ├── config/         # Database, env, swagger config
│   │   ├── controllers/    # Route handlers (thin HTTP layer)
│   │   ├── jobs/           # Background cron jobs
│   │   ├── middlewares/    # Auth, RBAC, validation, error handling
│   │   ├── routes/         # Express routers with Swagger annotations
│   │   ├── services/       # Business logic layer
│   │   ├── types/          # Shared TypeScript types
│   │   ├── utils/          # Helpers (pagination, response, params)
│   │   └── validators/     # Zod schemas
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Demo data seeder
│   ├── Dockerfile
│   └── start.sh            # Docker entrypoint (migrate → seed → start)
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios API client functions
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Auth context
│   │   ├── hooks/          # React Query hooks
│   │   ├── lib/            # Utilities and constants
│   │   ├── pages/          # Page components by feature
│   │   └── types/          # TypeScript API types
│   ├── Dockerfile
│   └── nginx.conf          # Nginx SPA config with API proxy
├── docker-compose.yml
├── postman_collection.json
└── README.md
```

---

## License

MIT © 2025 TaskFlow
