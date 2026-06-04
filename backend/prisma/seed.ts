import {
  PrismaClient,
  Role,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordAdmin = await bcrypt.hash('Admin@123', 12);
  const passwordPm = await bcrypt.hash('PM@123', 12);
  const passwordEmp = await bcrypt.hash('Emp@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@demo.com',
      password: passwordAdmin,
      role: Role.ADMIN,
    },
  });

  const pm = await prisma.user.upsert({
    where: { email: 'pm@demo.com' },
    update: {},
    create: {
      name: 'Project Manager',
      email: 'pm@demo.com',
      password: passwordPm,
      role: Role.PROJECT_MANAGER,
    },
  });

  const emp1 = await prisma.user.upsert({
    where: { email: 'emp1@demo.com' },
    update: {},
    create: {
      name: 'Employee One',
      email: 'emp1@demo.com',
      password: passwordEmp,
      role: Role.EMPLOYEE,
    },
  });

  const emp2 = await prisma.user.upsert({
    where: { email: 'emp2@demo.com' },
    update: {},
    create: {
      name: 'Employee Two',
      email: 'emp2@demo.com',
      password: passwordEmp,
      role: Role.EMPLOYEE,
    },
  });

  const project1 = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Complete overhaul of the corporate website',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-06-30'),
      status: ProjectStatus.ACTIVE,
      managerId: pm.id,
      createdById: admin.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App MVP',
      description: 'Build minimum viable product for mobile platform',
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-09-30'),
      status: ProjectStatus.PLANNING,
      managerId: pm.id,
      createdById: pm.id,
    },
  });

  const taskData = [
    {
      name: 'Design homepage mockups',
      description: 'Create Figma mockups for the new homepage',
      priority: TaskPriority.HIGH,
      status: TaskStatus.IN_PROGRESS,
      deadline: new Date('2025-04-15'),
      estimatedHours: 16,
      projectId: project1.id,
      createdById: pm.id,
      assigneeId: emp1.id,
    },
    {
      name: 'Implement authentication',
      description: 'JWT-based auth for the web app',
      priority: TaskPriority.CRITICAL,
      status: TaskStatus.TODO,
      deadline: new Date('2025-05-01'),
      estimatedHours: 24,
      projectId: project1.id,
      createdById: pm.id,
      assigneeId: emp2.id,
    },
    {
      name: 'API specification',
      description: 'Document REST API endpoints',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.IN_REVIEW,
      deadline: new Date('2025-04-20'),
      estimatedHours: 8,
      projectId: project2.id,
      createdById: pm.id,
      assigneeId: emp1.id,
    },
    {
      name: 'Setup CI/CD pipeline',
      description: 'Configure GitHub Actions for deployments',
      priority: TaskPriority.HIGH,
      status: TaskStatus.TODO,
      deadline: new Date('2025-05-15'),
      estimatedHours: 12,
      projectId: project2.id,
      createdById: admin.id,
      assigneeId: emp2.id,
    },
  ];

  for (const item of taskData) {
    const { assigneeId, ...taskFields } = item;
    const task = await prisma.task.create({ data: taskFields });
    await prisma.taskAssignment.create({
      data: {
        taskId: task.id,
        userId: assigneeId,
        assignedById: pm.id,
      },
    });
  }

  console.log('Seed completed successfully');
  console.log({
    users: [admin.email, pm.email, emp1.email, emp2.email],
    projects: [project1.name, project2.name],
    tasks: taskData.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
