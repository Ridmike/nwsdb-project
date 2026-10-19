import StatusBadge from '../StatusBadge/StatusBadge';
import './Timeline.css';

export function Timeline({ children, className = '' }) {
  return <div className={`nwsdb-timeline ${className}`}>{children}</div>;
}

export function TimelineItem({
  status = 'received',
  fromPerson,
  fromSection,
  toPerson,
  toSection,
  handoverTime,
  receiptTime,
  timeInTransit,
  timeHeld,
  delayReason,
  notes,
  recordedBy,
  isCurrent = false,
  className = ''
}) {
  return (
    <div className={`nwsdb-timeline-item ${isCurrent ? 'nwsdb-timeline-item--current' : ''} ${className}`}>
      {/* Node / Marker */}
      <div className="nwsdb-timeline-item__marker">
        <div className="nwsdb-timeline-item__dot">
          {isCurrent && <span className="nwsdb-timeline-item__pulse" />}
        </div>
        <div className="nwsdb-timeline-item__line" />
      </div>

      {/* Content Card */}
      <div className="nwsdb-timeline-item__content">
        <div className="nwsdb-timeline-item__header">
          <div className="nwsdb-timeline-item__title-row">
            <span className="nwsdb-timeline-item__routing">
              <strong className="nwsdb-timeline-item__party">{fromPerson || fromSection || 'Origin'}</strong>
              <span className="nwsdb-timeline-item__arrow" aria-hidden="true">→</span>
              <strong className="nwsdb-timeline-item__party">{toPerson || toSection || 'Recipient'}</strong>
            </span>
            <StatusBadge status={status} size="sm" />
          </div>

          {(fromSection || toSection) && (
            <div className="nwsdb-timeline-item__sections">
              {fromSection && <span className="nwsdb-timeline-item__sec-badge">From: {fromSection}</span>}
              {toSection && <span className="nwsdb-timeline-item__sec-badge">To: {toSection}</span>}
            </div>
          )}
        </div>

        {/* Timestamps & Durations Grid */}
        <div className="nwsdb-timeline-item__timestamps">
          <div className="nwsdb-timeline-item__time-col">
            <span className="nwsdb-timeline-item__time-label">Handover</span>
            <span className="nwsdb-timeline-item__time-val">{handoverTime || '—'}</span>
          </div>
          <div className="nwsdb-timeline-item__time-col">
            <span className="nwsdb-timeline-item__time-label">Receipt Confirmed</span>
            <span className="nwsdb-timeline-item__time-val">
              {receiptTime || <em className="nwsdb-timeline-item__pending-text">Pending receipt</em>}
            </span>
          </div>
          {timeInTransit && (
            <div className="nwsdb-timeline-item__time-col">
              <span className="nwsdb-timeline-item__time-label">In Transit</span>
              <span className="nwsdb-timeline-item__time-badge nwsdb-timeline-item__time-badge--transit">
                {timeInTransit}
              </span>
            </div>
          )}
          {timeHeld && (
            <div className="nwsdb-timeline-item__time-col">
              <span className="nwsdb-timeline-item__time-label">Time Held</span>
              <span className="nwsdb-timeline-item__time-badge nwsdb-timeline-item__time-badge--held">
                {timeHeld}
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        {notes && (
          <div className="nwsdb-timeline-item__notes">
            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>{notes}</span>
          </div>
        )}

        {/* Delay Reason Alert */}
        {delayReason && (
          <div className="nwsdb-timeline-item__delay-alert">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <strong>Delay Reason:</strong> {delayReason}
            </div>
          </div>
        )}

        {/* Audit Meta */}
        {recordedBy && (
          <div className="nwsdb-timeline-item__meta">
            Recorded by: <span>{recordedBy}</span>
          </div>
        )}
      </div>
    </div>
  );
}

Timeline.Item = TimelineItem;
export default Timeline;
