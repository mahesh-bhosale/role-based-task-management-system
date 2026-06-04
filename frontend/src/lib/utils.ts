import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined, fmt = 'MMM d, yyyy'): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? format(d, fmt) : '—';
}

export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, 'MMM d, yyyy HH:mm');
}

export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : '—';
}

export function truncate(str: string, length = 50): string {
  return str.length > length ? str.slice(0, length) + '…' : str;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function roleBadgeColor(role: string): string {
  switch (role) {
    case 'ADMIN': return 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30';
    case 'PROJECT_MANAGER': return 'bg-purple-400/20 text-purple-400 border-purple-400/30';
    case 'EMPLOYEE': return 'bg-cyan-400/20 text-cyan-400 border-cyan-400/30';
    default: return 'bg-slate-400/20 text-slate-400 border-slate-400/30';
  }
}

export function roleLabel(role: string): string {
  switch (role) {
    case 'ADMIN': return 'Admin';
    case 'PROJECT_MANAGER': return 'Project Manager';
    case 'EMPLOYEE': return 'Employee';
    default: return role;
  }
}
