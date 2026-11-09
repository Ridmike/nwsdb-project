const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

const currencyFormatter = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  maximumFractionDigits: 2
});

const monthFormatter = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  year: 'numeric'
});

function toDate(value) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value) {
  const date = toDate(value);
  return date ? dateFormatter.format(date) : '—';
}

export function formatDateTime(value) {
  const date = toDate(value);
  return date ? dateTimeFormatter.format(date) : '—';
}

export function formatMonth(value) {
  if (!value) {
    return '—';
  }
  const date = /^\d{4}-\d{2}$/.test(value) ? new Date(`${value}-01T00:00:00`) : toDate(value);
  return date && !Number.isNaN(date.getTime()) ? monthFormatter.format(date) : String(value);
}

export function formatCurrency(value) {
  const number = Number(value);
  return Number.isFinite(number) ? currencyFormatter.format(number) : '—';
}

export function getInitials(name, email) {
  const source = String(name || email || '').trim();
  if (!source) {
    return '?';
  }
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function durationBetween(start, end) {
  const startDate = toDate(start);
  const endDate = toDate(end);
  if (!startDate || !endDate) {
    return null;
  }
  return Math.max(0, endDate.getTime() - startDate.getTime());
}

export function formatDuration(milliseconds) {
  if (milliseconds === null || milliseconds === undefined || !Number.isFinite(milliseconds)) {
    return '—';
  }

  const minutes = Math.floor(milliseconds / 60000);
  if (minutes < 1) {
    return 'Less than a minute';
  }

  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const remainingMinutes = minutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${remainingMinutes}m`;
}

export function daysSince(value) {
  const date = toDate(value);
  if (!date) {
    return null;
  }
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

export function daysBetween(start, end) {
  const startDate = toDate(start);
  const endDate = toDate(end) || new Date();
  if (!startDate) {
    return null;
  }
  return Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / 86400000));
}

export function isOverdue(dueDate, status) {
  const date = toDate(dueDate);
  if (!date || status === 'completed' || status === 'cancelled') {
    return false;
  }
  return date.getTime() < Date.now();
}

export function toDateTimeInput(value) {
  const date = toDate(value);
  if (!date) {
    return '';
  }
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

export function toDateInput(value) {
  const date = toDate(value);
  return date ? date.toISOString().slice(0, 10) : '';
}
