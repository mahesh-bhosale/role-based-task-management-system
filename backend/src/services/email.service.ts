import nodemailer from 'nodemailer';
import { env } from '../config/env';

// ── Transporter ───────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth:
    env.SMTP_USER && env.SMTP_PASS
      ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
      : undefined,
});

// ── Base sender ───────────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (env.NODE_ENV === 'development' && !env.SMTP_USER) {
    console.log('[Email stub]', { to, subject });
    return;
  }

  try {
    await transporter.sendMail({ from: env.EMAIL_FROM, to, subject, html });
    console.log(`[Email] Sent "${subject}" → ${to}`);
  } catch (err) {
    console.error(`[Email] Failed to send "${subject}" → ${to}:`, err);
  }
}

// ── Shared HTML helpers ───────────────────────────────────────────────────────

function buildEmailWrapper(title: string, accentColor: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:8px;overflow:hidden;
                      box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:${accentColor};padding:24px 32px;">
              <p style="margin:0;color:#ffffff;font-size:13px;letter-spacing:1px;
                        text-transform:uppercase;font-weight:600;">Task Management System</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;">
                ${title}
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f4f6f9;padding:16px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
                This is an automated message from your Task Management System.<br/>
                Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function infoRow(label: string, value: string, valueColor = '#111827'): string {
  return `
  <tr>
    <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;
               font-weight:600;color:#6b7280;font-size:13px;width:140px;">
      ${label}
    </td>
    <td style="padding:8px 12px;border:1px solid #e5e7eb;
               border-left:none;color:${valueColor};font-size:14px;">
      ${value}
    </td>
  </tr>`;
}

function ctaButton(href: string, label: string, color: string): string {
  return `
  <div style="text-align:center;margin-top:28px;">
    <a href="${href}"
       style="display:inline-block;background:${color};color:#ffffff;
              padding:12px 32px;border-radius:6px;text-decoration:none;
              font-weight:700;font-size:15px;letter-spacing:0.3px;">
      ${label}
    </a>
  </div>`;
}

// ── sendDeadlineReminder ──────────────────────────────────────────────────────

export async function sendDeadlineReminder(params: {
  to: string;
  userName: string;
  taskName: string;
  taskId: string;
  projectName: string;
  deadline: Date;
  hoursLeft: number;
}): Promise<void> {
  const { to, userName, taskName, taskId, projectName, deadline, hoursLeft } = params;

  const subject = `Reminder: Task '${taskName}' due in ${Math.round(hoursLeft)} hours`;
  const deadlineStr = deadline.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const urgencyColor = hoursLeft <= 12 ? '#dc2626' : hoursLeft <= 24 ? '#d97706' : '#2563eb';
  const urgencyLabel = hoursLeft <= 1 ? '⚠️ URGENT' : hoursLeft <= 12 ? '🔔 HIGH PRIORITY' : '📅 REMINDER';

  const body = `
    <p style="margin:0 0 20px;color:#374151;font-size:15px;">
      Hi <strong>${userName}</strong>,
    </p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;">
      This is a reminder that you have a task due soon. Please review the details below
      and make sure to complete it on time.
    </p>

    <div style="background:#eff6ff;border-left:4px solid ${urgencyColor};
                padding:12px 16px;margin-bottom:24px;border-radius:0 6px 6px 0;">
      <span style="color:${urgencyColor};font-weight:700;font-size:14px;">${urgencyLabel}</span>
      <span style="color:#374151;font-size:14px;margin-left:8px;">
        Due in <strong>${Math.round(hoursLeft)} hours</strong>
      </span>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="border-collapse:collapse;margin-bottom:24px;">
      ${infoRow('Task', `<strong>${taskName}</strong>`)}
      ${infoRow('Project', projectName)}
      ${infoRow('Deadline', `<strong style="color:${urgencyColor};">${deadlineStr}</strong>`)}
      ${infoRow('Hours Left', `<strong style="color:${urgencyColor};">${Math.round(hoursLeft)} hours</strong>`, urgencyColor)}
    </table>

    <p style="color:#6b7280;font-size:13px;">
      Click the button below to view the task details and update your progress.
    </p>

    ${ctaButton(`${env.FRONTEND_URL}/tasks/${taskId}`, 'View Task →', urgencyColor)}
  `;

  await sendEmail(to, subject, buildEmailWrapper('Task Deadline Reminder', urgencyColor, body));
}

// ── sendOverdueAlert ──────────────────────────────────────────────────────────

export async function sendOverdueAlert(params: {
  to: string;
  userName: string;
  taskName: string;
  taskId: string;
  projectName: string;
  deadline: Date;
  role?: string;
}): Promise<void> {
  const { to, userName, taskName, taskId, projectName, deadline, role } = params;

  const subject = `Overdue: Task '${taskName}' is past its deadline`;
  const deadlineStr = deadline.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const now = new Date();
  const overdueMs = now.getTime() - deadline.getTime();
  const overdueHours = Math.round(overdueMs / 3600000);

  const isManager = role === 'PROJECT_MANAGER';
  const accentColor = '#dc2626';

  const introText = isManager
    ? `A task in your project has passed its deadline and requires your attention.`
    : `One of your assigned tasks has passed its deadline. Please take immediate action.`;

  const body = `
    <p style="margin:0 0 20px;color:#374151;font-size:15px;">
      Hi <strong>${userName}</strong>,
    </p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;">
      ${introText}
    </p>

    <div style="background:#fef2f2;border-left:4px solid #dc2626;
                padding:12px 16px;margin-bottom:24px;border-radius:0 6px 6px 0;">
      <span style="color:#dc2626;font-weight:700;font-size:14px;">🚨 OVERDUE</span>
      <span style="color:#374151;font-size:14px;margin-left:8px;">
        This task is <strong>${overdueHours} hour${overdueHours !== 1 ? 's' : ''} past its deadline</strong>
      </span>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="border-collapse:collapse;margin-bottom:24px;">
      ${infoRow('Task', `<strong>${taskName}</strong>`)}
      ${infoRow('Project', projectName)}
      ${infoRow('Deadline', `<strong style="color:#dc2626;">${deadlineStr}</strong>`, '#dc2626')}
      ${infoRow('Overdue By', `<strong style="color:#dc2626;">${overdueHours} hour${overdueHours !== 1 ? 's' : ''}</strong>`, '#dc2626')}
      ${isManager ? infoRow('Your Role', 'Project Manager') : ''}
    </table>

    <p style="color:#6b7280;font-size:13px;">
      ${isManager
        ? 'Please follow up with the assigned team member and take appropriate action.'
        : 'Please update the task status or contact your project manager immediately.'}
    </p>

    ${ctaButton(`${env.FRONTEND_URL}/tasks/${taskId}`, 'View Task →', '#dc2626')}
  `;

  await sendEmail(to, subject, buildEmailWrapper('Task Overdue Alert', accentColor, body));
}

// ── sendTestEmail (for admin test endpoint) ───────────────────────────────────

export async function sendTestEmail(params: {
  to: string;
  type: 'reminder' | 'overdue';
}): Promise<void> {
  const { to, type } = params;

  if (type === 'reminder') {
    await sendDeadlineReminder({
      to,
      userName: 'Test User',
      taskName: 'Sample Task',
      taskId: '00000000-0000-0000-0000-000000000001',
      projectName: 'Sample Project',
      deadline: new Date(Date.now() + 24 * 3600000),
      hoursLeft: 24,
    });
  } else {
    await sendOverdueAlert({
      to,
      userName: 'Test User',
      taskName: 'Sample Task',
      taskId: '00000000-0000-0000-0000-000000000001',
      projectName: 'Sample Project',
      deadline: new Date(Date.now() - 2 * 3600000),
      role: 'EMPLOYEE',
    });
  }
}
