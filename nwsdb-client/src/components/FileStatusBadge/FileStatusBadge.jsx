import './FileStatusBadge.css';

const STATUS_MAP = {
  open: { label: 'Open', tone: 'info' },
  pending_receipt: { label: 'Awaiting receipt', tone: 'warning' },
  pending_approval: { label: 'Pending approval', tone: 'review' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'muted' },
  approved: { label: 'Approved', tone: 'success' },
  returned: { label: 'Returned', tone: 'danger' },
  skipped: { label: 'Skipped', tone: 'muted' },
  pending: { label: 'Pending', tone: 'review' },
  handed_over: { label: 'Handed over', tone: 'warning' },
  received: { label: 'Received', tone: 'success' },
  active: { label: 'Active', tone: 'success' },
  inactive: { label: 'Disabled', tone: 'muted' }
};

export function FileStatusBadge({ status, label, overdue = false, size = 'md' }) {
  if (overdue && !['completed', 'cancelled'].includes(status)) {
    return (
      <span className={`file-status file-status--danger file-status--${size}`}>
        <span className="file-status__dot" />
        Overdue
      </span>
    );
  }

  const config = STATUS_MAP[status] || { label: status || 'Unknown', tone: 'muted' };

  return (
    <span className={`file-status file-status--${config.tone} file-status--${size}`}>
      <span className="file-status__dot" />
      {label || config.label}
    </span>
  );
}

export default FileStatusBadge;
