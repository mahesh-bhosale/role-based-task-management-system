import cron from 'node-cron';
import { TaskStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { notificationService } from '../services/notification.service';

async function checkDeadlines(): Promise<void> {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const overdueTasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
      deadline: { lt: now },
      status: { notIn: [TaskStatus.COMPLETED] },
    },
    include: {
      assignments: { include: { user: true } },
      project: { select: { managerId: true, name: true } },
    },
  });

  for (const task of overdueTasks) {
    const notifyUserIds = new Set<string>();
    task.assignments.forEach((a) => notifyUserIds.add(a.userId));
    if (task.project.managerId) {
      notifyUserIds.add(task.project.managerId);
    }

    for (const userId of notifyUserIds) {
      await notificationService.create({
        userId,
        type: 'TASK_OVERDUE',
        message: `Task "${task.name}" is overdue`,
        entityId: task.id,
      });
    }
  }

  const upcomingTasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
      deadline: { gte: now, lte: in24Hours },
      status: { notIn: [TaskStatus.COMPLETED] },
    },
    include: {
      assignments: true,
      project: { select: { managerId: true, name: true } },
    },
  });

  for (const task of upcomingTasks) {
    const notifyUserIds = new Set<string>();
    task.assignments.forEach((a) => notifyUserIds.add(a.userId));
    if (task.project.managerId) {
      notifyUserIds.add(task.project.managerId);
    }

    for (const userId of notifyUserIds) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          entityId: task.id,
          type: 'TASK_DEADLINE_SOON',
          sentAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
      });

      if (!existing) {
        await notificationService.create({
          userId,
          type: 'TASK_DEADLINE_SOON',
          message: `Task "${task.name}" deadline is within 24 hours`,
          entityId: task.id,
        });
      }
    }
  }

  console.log(
    `[DeadlineChecker] Processed ${overdueTasks.length} overdue, ${upcomingTasks.length} upcoming tasks`
  );
}

export function startDeadlineChecker(): void {
  if (!env.ENABLE_SCHEDULER) {
    console.log('[DeadlineChecker] Scheduler disabled');
    return;
  }

  cron.schedule('0 */6 * * *', () => {
    checkDeadlines().catch((err) => console.error('[DeadlineChecker] Error:', err));
  });

  console.log('[DeadlineChecker] Scheduled to run every 6 hours');
}
