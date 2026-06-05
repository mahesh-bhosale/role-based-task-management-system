# TaskFlow — Role-Based Task Management System

<div align="center">

![TaskFlow](https://img.shields.io/badge/TaskFlow-v1.0.0-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react)
![MySQL](https://img.shields.io/badge/MySQL-8.x-orange?style=for-the-badge&logo=mysql)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)

A full-stack, production-ready task management application designed for the **Senior Full Stack Developer** assignment at Millennial Company.

</div>

---

## 🚀 Live Demo

**Deployed Application:** [https://role-based-task-management-system-rouge.vercel.app](https://role-based-task-management-system-rouge.vercel.app)

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@demo.com` | `Admin@123` |
| **Project Manager** | `pm@demo.com` | `PM@123` |
| **Employee** | `emp1@demo.com` | `Emp@123` |
| **Employee** | `emp2@demo.com` | `Emp@123` |

---

## 🎯 Objective
This project is a Role-Based Project & Task Management System built to demonstrate clean architecture, scalability, security, and production-ready development practices as outlined in the assignment brief. 

---

## ✨ Features Implemented

### Core Modules
- ✅ **Authentication & RBAC:** Complete JWT authentication flow (Login/Logout/Password Reset). Strict Role-Based Access Control enforcing permissions across Admin, Project Manager, and Employee scopes.
- ✅ **Role-Based Dashboards:** Distinct dashboards providing statistical overviews (total projects, tasks, completion rates, upcoming deadlines) tailored strictly to the user's role.
- ✅ **Project Management:** Full CRUD operations with fields for Name, Description, Dates, Status, and Manager assignment.
- ✅ **Task Management:** Create, assign, status tracking (To Do, In Progress, In Review, Completed), and deadline management.
- ✅ **Work Log System:** Employees can submit time-tracked work logs with descriptions. Managers can review and reply to logs, preserving conversation history.
- ✅ **Email Notification System:** Automated deadline reminders (via CRON) and overdue alerts sent to both employees and managers.
- ✅ **Activity Audit Log:** Comprehensive system-wide tracking of entity creations, updates, and status changes, capturing previous and new values.
- ✅ **Search & Filters:** Robust filtering across projects, tasks, and logs by status, assignee, priority, and date constraints.
- ✅ **Reports:** Progress and completion analytics available to Admins and Project Managers.

### 🌟 Bonus Features
- 🚀 **Real-Time Notifications:** Implemented via **WebSockets** (Socket.io) for instant UI updates when tasks are assigned or updated.
- 🚀 **Kanban Board:** A highly responsive, interactive Kanban view with drag-and-drop status updates.
- 🚀 **CI/CD Pipeline:** Automated testing and build verification via GitHub Actions (`.github/workflows/ci.yml`).
- 🚀 **Unit & Integration Tests:** Comprehensive test coverage using Jest and Supertest.
- 🚀 **Dockerized Deployment:** Fully containerized setup with multi-stage builds (`docker-compose.yml`, `frontend/Dockerfile`, `backend/Dockerfile`).
- 🚀 **API Documentation:** Interactive Swagger UI and an included exported `postman_collection.json`.
- 🚀 **Modern UI:** Dark mode enabled by default with a beautiful, fully responsive Shadcn/Tailwind design.

---

## 🏗️ Architecture & Tech Stack

| Component | Technology | Description |
|-----------|------------|-------------|
| **Frontend** | React 18, Vite, TypeScript, TailwindCSS | Found in the `frontend/` directory. Uses TanStack Query for state management. |
| **Backend** | Node.js, Express, TypeScript | Found in the `backend/` directory. Features a layered architecture (Controllers, Services, Repositories). |
| **Database** | MySQL 8, Prisma ORM | Highly normalized schema ensuring relational integrity. |
| **Background Jobs**| node-cron | Handles scheduled deadline and overdue alert emails. |
| **Tooling** | Docker, GitHub Actions, Jest | Ensuring code quality, containerization, and continuous integration. |

### Key Design Decisions
1. **Prisma ORM for Type Safety:** Ensures end-to-end type safety from the database schema directly to the frontend API types.
2. **Soft Deletes:** Deletions apply a `deletedAt` timestamp to preserve referential integrity for historical Audit Logs.
3. **Service Layer Pattern:** Business logic is entirely decoupled from Express controllers to improve testability.
4. **JWT Rotation & Security:** Access tokens are short-lived, with refresh tokens securely stored to allow remote session revocation.

---

## 📸 Screenshots
*(Adding screenshots later prior to final submission)*

- **Admin Dashboard:** `[Placeholder for Admin Dashboard Screenshot]`
- **Kanban Board:** `[Placeholder for Kanban Board Screenshot]`
- **Work Logs & Replies:** `[Placeholder for Work Logs Screenshot]`
- **Audit Logging:** `[Placeholder for Audit Log Screenshot]`

---

## 🛠️ Local Setup & Deployment

### Using Docker (Recommended)
The easiest way to run the entire stack (Database, Backend, Frontend) is via Docker Compose.

```bash
# Clone the repository
git clone <repository-url>
cd role-based-task-management-system

# Start all services
docker-compose up --build
```
- **Frontend:** http://localhost
- **Backend API:** http://localhost:5000/api

### Manual Setup

**1. Backend:**
```bash
cd backend
npm install
cp .env.example .env # Configure your database connection and SMTP details
npx prisma migrate dev
npx prisma db seed # Seeds the database with demo users and projects
npm run dev
```

**2. Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 📚 API Documentation

You can explore the API using two methods:

1. **Postman:** Import the included `postman_collection.json` file located in the root directory.
2. **Swagger UI:** Start the backend server and navigate to `http://localhost:5000/api-docs` for the interactive OpenAPI documentation.

---

## ✅ Evaluation Criteria Addressed
- **Database Design & Normalization:** Strictly normalized MySQL schema with clear relations (1:N, M:N).
- **RBAC Implementation:** Middleware-level and UI-level role checks.
- **Code Quality:** ESLint, Prettier, strict TypeScript, and modular file structures.
- **Security Practices:** 
  - **Helmet.js**: Sets secure HTTP headers (XSS filtering, no-sniff, clickjacking protection).
  - **CORS Policy**: Strictly configured to only allow requests from the designated frontend URL.
  - **Rate Limiting**: Applied to `/api/auth` endpoints to prevent brute-force attacks.
  - **Input Validation**: Strict runtime payload validation via Zod, preventing NoSQL/SQL injection attacks by dropping unexpected keys.
  - **JWT Rotation**: Access tokens expire quickly (15m) while refresh tokens are persisted in the database and can be revoked.
  - **Password Hashing**: Bcrypt with appropriate salt rounds.
  - **Payload Size Limits**: Request body limits enforced (`10mb`) to prevent memory exhaustion/DoS attacks.
- **Testing Coverage:** Included Jest Integration test suites covering core API flows.
