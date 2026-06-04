import cron from 'node-cron';
import { TaskStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { sendDeadlineReminder, sendOverdueAlert } from '../services/email.service';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Reminder windows in hours. For each, we send a notification once per window. */
const REMINDER_WINDOWS = [48, 24, 12, 1] as const;

/** Buffer in hours: a run counts as "inside the window" if
 *  hoursLeft is in [window, window + 0.25] (15-min buffer matches cron interval). */
const WINDOW_BUFFER = 0.25;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function notificationExists(
  userId: string,
  taskId: string,
  type: string
): Promise<boolean> {
  const found = await prisma.notification.findFirst({
    where: { userId, entityId: taskId, type },
    select: { id: true },
  });
  return found !== null;
}

async function createNotification(
  userId: string,
  taskId: string,
  type: string,
  message: string
): Promise<void> {
  await prisma.notification.create({
    data: { userId, type, message, entityId: taskId },
  });
}

// ── Core check ────────────────────────────────────────────────────────────────

async function checkDeadlines(): Promise<void> {
  const now = new Date();
  console.log(`[DeadlineChecker] Running at ${now.toISOString()}`);

  // Query all non-finished tasks that have a deadline
  const tasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
      deadline: { not: null },
      status: { notIn: [TaskStatus.COMPLETED] },
    },
    include: {
      assignments: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          managerId: true,
          manager: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  let reminders = 0;
  let overdueAlerts = 0;

  for (const task of tasks) {
    // deadline is guaranteed non-null by the where clause
    const deadline = task.deadline as Date;
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / 3_600_000;

    // ── 1. Reminder windows ───────────────────────────────────────────────────
    for (const window of REMINDER_WINDOWS) {
      if (hoursUntilDeadline >= window && hoursUntilDeadline < window + WINDOW_BUFFER) {
        // Notify each assigned employee
        for (const assignment of task.assignments) {
          const { user } = assignment;
          const empType = `reminder_${window}h`;

          if (!(await notificationExists(user.id, task.id, empType))) {
            // In-app notification
            await createNotification(
              user.id,
              task.id,
              empType,
              `Task "${task.name}" is due in ${window} hours`
            );

            // Email
            await sendDeadlineReminder({
              to: user.email,
              userName: user.name,
              taskName: task.name,
              taskId: task.id,
              projectName: task.project.name,
              deadline,
              hoursLeft: hoursUntilDeadline,
            });

            reminders++;
          }
        }

        // Notify PM
        if (task.project.managerId && task.project.manager) {
          const pm = task.project.manager;
          const pmType = `pm_reminder_${window}h`;

          if (!(await notificationExists(pm.id, task.id, pmType))) {
            await createNotification(
              pm.id,
              task.id,
              pmType,
              `Task "${task.name}" in your project is due in ${window} hours`
            );

            await sendDeadlineReminder({
              to: pm.email,
              userName: pm.name,
              taskName: task.name,
              taskId: task.id,
              projectName: task.project.name,
              deadline,
              hoursLeft: hoursUntilDeadline,
            });

            reminders++;
          }
        }
      }
    }

    // ── 2. Overdue ────────────────────────────────────────────────────────────
    if (hoursUntilDeadline <= 0) {
      // Notify each assigned employee
      for (const assignment of task.assignments) {
        const { user } = assignment;
        const empType = 'overdue_employee';

        if (!(await notificationExists(user.id, task.id, empType))) {
          await createNotification(
            user.id,
            task.id,
            empType,
            `Task "${task.name}" is overdue`
          );

          await sendOverdueAlert({
            to: user.email,
            userName: user.name,
            taskName: task.name,
            taskId: task.id,
            projectName: task.project.name,
            deadline,
            role: 'EMPLOYEE',
          });

          overdueAlerts++;
        }
      }

      // Notify PM
      if (task.project.managerId && task.project.manager) {
        const pm = task.project.manager;
        const pmType = 'overdue_pm';

        if (!(await notificationExists(pm.id, task.id, pmType))) {
          await createNotification(
            pm.id,
            task.id,
            pmType,
            `Task "${task.name}" in your project is overdue`
          );

          await sendOverdueAlert({
            to: pm.email,
            userName: pm.name,
            taskName: task.name,
            taskId: task.id,
            projectName: task.project.name,
            deadline,
            role: 'PROJECT_MANAGER',
          });

          overdueAlerts++;
        }
      }
    }
  }

  console.log(
    `[DeadlineChecker] Done — ${reminders} reminder(s), ${overdueAlerts} overdue alert(s) sent`
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export function startDeadlineChecker(): void {
  if (!env.ENABLE_SCHEDULER) {
    console.log('[DeadlineChecker] Scheduler disabled (ENABLE_SCHEDULER=false)');
    return;
  }

  // Run every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    checkDeadlines().catch((err) => console.error('[DeadlineChecker] Error:', err));
  });

  console.log('[DeadlineChecker] Scheduled — runs every 15 minutes');

  // Run immediately on startup so we don't wait 15 min for first check
  checkDeadlines().catch((err) =>
    console.error('[DeadlineChecker] Initial run error:', err)
  );
}
