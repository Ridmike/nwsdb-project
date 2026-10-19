import './StatusIndicator.css';

export function StatusIndicator({
  status = 'active', // 'active' | 'warning' | 'danger' | 'offline' | 'transit'
  label,
  pulse = true,
  className = ''
}) {
  return (
    <span className={`nwsdb-indicator nwsdb-indicator--${status} ${className}`}>
      <span className="nwsdb-indicator__dot-wrapper">
        <span className="nwsdb-indicator__dot" />
        {pulse && <span className="nwsdb-indicator__pulse" />}
      </span>
      {label && <span className="nwsdb-indicator__label">{label}</span>}
    </span>
  );
}

export default StatusIndicator;
