import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button/Button';
import { Card } from '../components/Card/Card';
import {
  AlertIcon,
  ArrowRightIcon,
  ChartIcon,
  ClockIcon,
  FileTextIcon,
  RefreshIcon
} from '../components/Icons/Icons';
import { PageHeader } from '../components/PageHeader/PageHeader';
import { StatCard } from '../components/StatCard/StatCard';
import { Table } from '../components/Table/Table';
import { getReportSummary } from '../services/reportService';
import { formatDate, formatDateTime, formatDuration, formatMonth } from '../utils/format';
import './ReportsPage.css';

const STATUS_LABELS = {
  open: 'Open',
  pending_receipt: 'Awaiting receipt',
  pending_approval: 'Pending approval',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    getReportSummary()
      .then((result) => {
        if (active) {
          setData(result);
          setError('');
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Could not load reports.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  function exportDelayedCsv() {
    const rows = [
      ['Reference', 'Consumer', 'Category', 'Days overdue', 'Current holder', 'Due date'],
      ...(data?.delayedFiles || []).map((file) => [
        file.reference,
        file.consumerName,
        file.categoryName,
        file.daysOverdue,
        file.currentHolderName,
        formatDate(file.dueDate)
      ])
    ];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nwsdb-delayed-files-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const totalFiles = (data?.statusCounts || []).reduce((total, item) => total + item.count, 0);
  const inTransitCount = data?.inTransit?.length || 0;
  const delayedCount = data?.delayedFiles?.length || 0;
  const maxMonthly = Math.max(1, ...(data?.monthlyRegistrations || []).map((item) => item.count));

  return (
    <div className="reports-page">
      <PageHeader
        eyebrow="Management information"
        title="Reports"
        description="Track turnaround time, current bottlenecks, delays, and file movement across sections."
        actions={
          <>
            <Button variant="outline" onClick={() => setReloadKey((value) => value + 1)} icon={<RefreshIcon size={15} />}>
              Refresh
            </Button>
            <Button variant="outline" onClick={exportDelayedCsv} disabled={!delayedCount}>
              Export delays (CSV)
            </Button>
            <Button variant="primary" onClick={() => window.print()}>
              Print report
            </Button>
          </>
        }
      />

      {error && (
        <div className="files-alert" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="reports-page__loading">Loading report data…</div>
      ) : (
        <>
          <section className="reports-stats">
            <StatCard label="Total files" value={totalFiles} hint="All registered cases" icon={<FileTextIcon size={28} />} />
            <StatCard
              label="Average transit"
              value={formatDuration(data?.averageTransitMs || 0)}
              hint="Handover to confirmed receipt"
              tone="primary"
              icon={<ClockIcon size={28} />}
            />
            <StatCard
              label="Currently in transit"
              value={inTransitCount}
              hint="Handed over, not received"
              tone="warning"
              icon={<ChartIcon size={28} />}
            />
            <StatCard
              label="Delayed files"
              value={delayedCount}
              hint="Past the due date"
              tone="danger"
              icon={<AlertIcon size={28} />}
            />
          </section>

          <div className="reports-grid">
            <Card className="reports-panel">
              <Card.Header>
                <Card.Title subtitle="Current position of all registered files">Status breakdown</Card.Title>
              </Card.Header>
              <Card.Body>
                <ul className="reports-bars">
                  {(data?.statusCounts || []).map((item) => {
                    const max = Math.max(1, ...(data.statusCounts || []).map((entry) => entry.count));
                    return (
                      <li key={item.status}>
                        <span>{STATUS_LABELS[item.status] || item.status}</span>
                        <span className="reports-bars__track">
                          <span style={{ width: `${(item.count / max) * 100}%` }} />
                        </span>
                        <strong>{item.count}</strong>
                      </li>
                    );
                  })}
                </ul>
              </Card.Body>
            </Card>

            <Card className="reports-panel">
              <Card.Header>
                <Card.Title subtitle="Files registered in the last six months">Monthly registrations</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="reports-columns">
                  {(data?.monthlyRegistrations || []).map((item) => (
                    <div key={item.month} className="reports-columns__item">
                      <span className="reports-columns__value">{item.count}</span>
                      <span
                        className="reports-columns__bar"
                        style={{ height: `${Math.max(8, (item.count / maxMonthly) * 100)}%` }}
                      />
                      <span className="reports-columns__label">{formatMonth(item.month)}</span>
                    </div>
                  ))}
                  {!data?.monthlyRegistrations?.length && <p className="reports-empty">No registrations yet.</p>}
                </div>
              </Card.Body>
            </Card>

            <Card className="reports-panel">
              <Card.Header>
                <Card.Title subtitle="Completed handovers per receiving section">Average time held</Card.Title>
              </Card.Header>
              <Card.Body noPadding>
                <ul className="reports-stage-list">
                  {(data?.stageAverages || []).map((item) => (
                    <li key={item.name}>
                      <span>
                        <strong>{item.name || 'Unassigned'}</strong>
                        <small>{item.count} completed handover{item.count === 1 ? '' : 's'}</small>
                      </span>
                      <span className="reports-stage-list__value">{formatDuration(item.averageMs)}</span>
                    </li>
                  ))}
                </ul>
                {!data?.stageAverages?.length && <p className="reports-empty">No completed handovers yet.</p>}
              </Card.Body>
            </Card>

            <Card className="reports-panel">
              <Card.Header>
                <Card.Title subtitle="All registered cases by error type">Category distribution</Card.Title>
              </Card.Header>
              <Card.Body>
                <ul className="reports-bars reports-bars--neutral">
                  {(data?.categoryCounts || []).map((item) => {
                    const max = Math.max(1, ...(data.categoryCounts || []).map((entry) => entry.count));
                    return (
                      <li key={item.name}>
                        <span>{item.name}</span>
                        <span className="reports-bars__track">
                          <span style={{ width: `${(item.count / max) * 100}%` }} />
                        </span>
                        <strong>{item.count}</strong>
                      </li>
                    );
                  })}
                </ul>
                {!data?.categoryCounts?.length && <p className="reports-empty">No categorised files yet.</p>}
              </Card.Body>
            </Card>

            <Card className="reports-panel reports-panel--wide">
              <Card.Header
                action={
                  <Link to="/files?overdue=1" className="reports-link">
                    View overdue files <ArrowRightIcon size={14} />
                  </Link>
                }
              >
                <Card.Title subtitle="Open files that have passed their due date">Delayed files</Card.Title>
              </Card.Header>
              <Card.Body noPadding>
                <Table>
                  <Table.Head>
                    <Table.Row>
                      <Table.HeaderCell>Reference</Table.HeaderCell>
                      <Table.HeaderCell>Consumer</Table.HeaderCell>
                      <Table.HeaderCell>Category</Table.HeaderCell>
                      <Table.HeaderCell>Current holder</Table.HeaderCell>
                      <Table.HeaderCell>Due date</Table.HeaderCell>
                      <Table.HeaderCell align="right">Days overdue</Table.HeaderCell>
                    </Table.Row>
                  </Table.Head>
                  <Table.Body emptyMessage="No delayed files.">
                    {(data?.delayedFiles || []).map((file) => (
                      <Table.Row key={file.id}>
                        <Table.Cell>
                          <Link to={`/files/${file.id}`} className="reports-file-link">
                            {file.reference}
                          </Link>
                        </Table.Cell>
                        <Table.Cell>{file.consumerName}</Table.Cell>
                        <Table.Cell>{file.categoryName}</Table.Cell>
                        <Table.Cell>{file.currentHolderName || 'Unassigned'}</Table.Cell>
                        <Table.Cell>{formatDate(file.dueDate)}</Table.Cell>
                        <Table.Cell align="right">
                          <span className="reports-days">{file.daysOverdue}</span>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </Card.Body>
            </Card>

            <Card className="reports-panel reports-panel--wide">
              <Card.Header>
                <Card.Title subtitle="Handed over but not yet confirmed as received">Files in transit</Card.Title>
              </Card.Header>
              <Card.Body noPadding>
                <Table>
                  <Table.Head>
                    <Table.Row>
                      <Table.HeaderCell>Reference</Table.HeaderCell>
                      <Table.HeaderCell>Consumer</Table.HeaderCell>
                      <Table.HeaderCell>From</Table.HeaderCell>
                      <Table.HeaderCell>To</Table.HeaderCell>
                      <Table.HeaderCell>Handed over</Table.HeaderCell>
                      <Table.HeaderCell align="right">Days in transit</Table.HeaderCell>
                    </Table.Row>
                  </Table.Head>
                  <Table.Body emptyMessage="No files are currently in transit.">
                    {(data?.inTransit || []).map((movement) => (
                      <Table.Row key={movement.id}>
                        <Table.Cell>
                          <Link to={`/files/${movement.fileId}`} className="reports-file-link">
                            {movement.fileReference}
                          </Link>
                        </Table.Cell>
                        <Table.Cell>{movement.consumerName}</Table.Cell>
                        <Table.Cell>{movement.fromDepartmentName || movement.fromName || '—'}</Table.Cell>
                        <Table.Cell>{movement.toDepartmentName || movement.toName || '—'}</Table.Cell>
                        <Table.Cell>{formatDateTime(movement.handoverAt)}</Table.Cell>
                        <Table.Cell align="right">
                          <span className={movement.daysInTransit > 2 ? 'reports-days' : ''}>
                            {movement.daysInTransit}
                          </span>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </Card.Body>
            </Card>

            <Card className="reports-panel reports-panel--full">
              <Card.Header>
                <Card.Title subtitle="Latest recorded activity in the system">Recent audit trail</Card.Title>
              </Card.Header>
              <Card.Body noPadding>
                <ul className="reports-audit">
                  {(data?.recentAudit || []).map((entry) => (
                    <li key={entry.id}>
                      <span className="reports-audit__dot" />
                      <span className="reports-audit__body">
                        <strong>{entry.actorName || 'System'}</strong>
                        <span>{entry.details}</span>
                      </span>
                      <span className="reports-audit__time">{formatDateTime(entry.createdAt)}</span>
                    </li>
                  ))}
                </ul>
                {!data?.recentAudit?.length && <p className="reports-empty">No activity recorded yet.</p>}
              </Card.Body>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default ReportsPage;
