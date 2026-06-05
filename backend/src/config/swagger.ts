import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TaskFlow API',
      version: '1.0.0',
      description: `
## TaskFlow — Role-Based Task Management System

A production-ready REST API supporting three roles:
- **ADMIN** — Full system access
- **PROJECT_MANAGER** — Manage their assigned projects and tasks
- **EMPLOYEE** — View assigned tasks and submit work logs

### Authentication
All endpoints (except \`/auth/login\` and \`/auth/register\`) require a JWT Bearer token.
Obtain tokens via the \`POST /auth/login\` endpoint.
      `,
      contact: {
        name: 'TaskFlow API Support',
        email: 'admin@taskflow.com',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'Current server',
      },
      {
        url: 'http://localhost:5000/api',
        description: 'Local development',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT access token obtained from POST /auth/login',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE'] },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED'] },
            managerId: { type: 'string', format: 'uuid', nullable: true },
          },
        },
        Task: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
            status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED'] },
            deadline: { type: 'string', format: 'date-time', nullable: true },
            estimatedHours: { type: 'number', nullable: true },
            projectId: { type: 'string', format: 'uuid' },
          },
        },
        WorkLog: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            description: { type: 'string' },
            hoursWorked: { type: 'number' },
            attachmentUrl: { type: 'string', nullable: true },
            taskId: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                items: { type: 'array', items: { type: 'object' } },
                meta: {
                  type: 'object',
                  properties: {
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    total: { type: 'integer' },
                    totalPages: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'object', nullable: true },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication & authorization' },
      { name: 'Users', description: 'User management (Admin only)' },
      { name: 'Projects', description: 'Project management' },
      { name: 'Tasks', description: 'Task management' },
      { name: 'WorkLogs', description: 'Employee work log tracking' },
      { name: 'Reports', description: 'Analytics and reporting' },
      { name: 'Dashboard', description: 'Role-aware dashboard statistics' },
      { name: 'Audit', description: 'Audit log history' },
      { name: 'Notifications', description: 'User notifications' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
