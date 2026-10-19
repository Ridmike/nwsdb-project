import './StatusBadge.css';

const STATUS_CONFIG = {
  handed_over: {
    label: 'Handed Over',
    className: 'nwsdb-status--handed-over',
    pulse: true
  },
  received: {
    label: 'Received / Held',
    className: 'nwsdb-status--received',
    pulse: false
  },
  pending_review: {
    label: 'Pending Review',
    className: 'nwsdb-status--pending-review',
    pulse: false
  },
  approved: {
    label: 'Approved',
    className: 'nwsdb-status--approved',
    pulse: false
  },
  returned: {
    label: 'Returned',
    className: 'nwsdb-status--returned',
    pulse: false
  },
  delayed: {
    label: 'Delayed',
    className: 'nwsdb-status--delayed',
    pulse: true
  },
  completed: {
    label: 'Completed',
    className: 'nwsdb-status--completed',
    pulse: false
  },
  default: {
    label: 'Active',
    className: 'nwsdb-status--default',
    pulse: false
  }
};

export function StatusBadge({
  status = 'default',
  label,
  size = 'md', // 'sm' | 'md'
  showDot = true,
  className = ''
}) {
  const normalizedKey = (status || '').toLowerCase().replace(/[\s-]/g, '_');
  const config = STATUS_CONFIG[normalizedKey] || STATUS_CONFIG.default;
  const displayText = label || config.label;

  return (
    <span className={`nwsdb-status-badge ${config.className} nwsdb-status-badge--${size} ${className}`}>
      {showDot && (
        <span
          className={`nwsdb-status-badge__dot ${config.pulse ? 'nwsdb-status-badge__dot--pulse' : ''}`}
          aria-hidden="true"
        />
      )}
      <span className="nwsdb-status-badge__text">{displayText}</span>
    </span>
  );
}

export default StatusBadge;
