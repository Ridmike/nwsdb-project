import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button/Button';
import { Card } from '../components/Card/Card';
import { FileStatusBadge } from '../components/FileStatusBadge/FileStatusBadge';
import {
  AlertIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  FileTextIcon,
  FolderIcon,
  PlusIcon
} from '../components/Icons/Icons';
import { PageHeader } from '../components/PageHeader/PageHeader';
import { StatCard } from '../components/StatCard/StatCard';
import { useAuth } from '../hooks/useAuth';
import { getDashboardSummary } from '../services/dashboardService';
import { formatDate, formatDateTime } from '../utils/format';
import { canCreateFiles, getRoleShortLabel } from '../utils/roles';
import './DashboardPage.css';

export function DashboardPage() {
  const { user, role } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    getDashboardSummary()
      .then((result) => {
        if (active) {
          setData(result);
          setError('');
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Could not load the dashboard.');
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

  const counts = data?.counts || {};

  return (
    <div className="dashboard-page">
      <PageHeader
        eyebrow="Overview"
        title={`Welcome, ${user?.displayName || 'Staff member'}`}
        description={`Signed in as ${getRoleShortLabel(role)}. Track current file locations, pending receipts, approvals, and delays.`}
        actions={
          <>
            <Button variant="outline" onClick={() => setReloadKey((value) => value + 1)}>
              Refresh
            </Button>
            {canCreateFiles(role) && (
              <Link to="/files?new=1">
                <Button variant="primary" icon={<PlusIcon size={16} />}>
                  Register file
                </Button>
              </Link>
            )}
          </>
        }
      />

      {error && (
        <div className="dashboard-alert" role="alert">
          {error}
          <button type="button" onClick={() => setReloadKey((value) => value + 1)}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <Card>
          <Card.Body>
            <div className="dashboard-loading">Loading dashboard…</div>
          </Card.Body>
        </Card>
      ) : (
        <>
          <section className="dashboard-stats">
            <StatCard label="Total files" value={counts.total ?? 0} hint="All registered cases" icon={<FileTextIcon size={30} />} />
            <StatCard label="Open" value={counts.open ?? 0} hint="In progress with a holder" tone="primary" icon={<FolderIcon size={30} />} />
            <StatCard label="Awaiting receipt" value={counts.pendingReceipt ?? 0} hint="Handed over, not confirmed" tone="warning" icon={<ClockIcon size={30} />} />
            <StatCard label="Pending approval" value={counts.pendingApproval ?? 0} hint="Review or signature required" tone="warning" icon={<CheckCircleIcon size={30} />} />
            <StatCard label="Overdue" value={counts.overdue ?? 0} hint="Past the due date" tone="danger" icon={<AlertIcon size={30} />} />
            <StatCard label="Average age" value={`${counts.averageAgeDays ?? 0}d`} hint="Since registration" tone="success" icon={<ClockIcon size={30} />} />
          </section>

          <div className="dashboard-grid">
            <Card className="dashboard-panel dashboard-panel--wide">
              <Card.Header action={<Link to="/files" className="dashboard-link">All files <ArrowRightIcon size={14} /></Link>}>
                <Card.Title subtitle="Files that have exceeded their due date">Overdue files</Card.Title>
              </Card.Header>
              <Card.Body noPadding>
                {data?.overdueFiles?.length ? (
                  <ul className="dashboard-list">
                    {data.overdueFiles.map((file) => (
                      <li key={file.id}>
                        <Link to={`/files/${file.id}`} className="dashboard-list__row">
                          <span className="dashboard-list__main">
                            <strong>{file.reference}</strong>
                            <small>{file.consumerName}</small>
                          </span>
                          <span className="dashboard-list__meta">
                            <FileStatusBadge status={file.status} overdue />
                            <small>Held by {file.currentHolderName || 'Unassigned'}</small>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="dashboard-empty">No overdue files. Good work.</p>
                )}
              </Card.Body>
            </Card>

            <Card className="dashboard-panel">
              <Card.Header action={<Link to="/files?status=pending_receipt" className="dashboard-link">View <ArrowRightIcon size={14} /></Link>}>
                <Card.Title subtitle="Handed over but receipt not confirmed">Awaiting receipt</Card.Title>
              </Card.Header>
              <Card.Body noPadding>
                {data?.awaitingReceipt?.length ? (
                  <ul className="dashboard-list">
                    {data.awaitingReceipt.map((file) => (
                      <li key={file.id}>
                        <Link to={`/files/${file.id}`} className="dashboard-list__row">
                          <span className="dashboard-list__main">
                            <strong>{file.reference}</strong>
                            <small>{file.currentHolderName || 'Unassigned'}</small>
                          </span>
                          <span className="dashboard-list__meta">
                            <small>{formatDateTime(file.lastMovementAt)}</small>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="dashboard-empty">No files awaiting receipt.</p>
                )}
              </Card.Body>
            </Card>

            <Card className="dashboard-panel">
              <Card.Header action={<Link to="/approvals" className="dashboard-link">View <ArrowRightIcon size={14} /></Link>}>
                <Card.Title subtitle="Assigned to your role">Pending approvals</Card.Title>
              </Card.Header>
              <Card.Body noPadding>
                {data?.pendingApprovals?.length ? (
                  <ul className="dashboard-list">
                    {data.pendingApprovals.map((approval) => (
                      <li key={approval.id}>
                        <Link to={`/files/${approval.fileId}`} className="dashboard-list__row">
                          <span className="dashboard-list__main">
                            <strong>{approval.title}</strong>
                            <small>{approval.fileReference} · {approval.consumerName}</small>
                          </span>
                          <span className="dashboard-list__meta">
                            <FileStatusBadge status="pending" label={getRoleShortLabel(approval.assignedRole)} />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="dashboard-empty">No pending approvals for your role.</p>
                )}
              </Card.Body>
            </Card>

            <Card className="dashboard-panel">
              <Card.Header>
                <Card.Title subtitle="Active files by current custodian">Files held by</Card.Title>
              </Card.Header>
              <Card.Body>
                {data?.heldBy?.length ? (
                  <ul className="dashboard-bars">
                    {data.heldBy.map((item) => {
                      const max = data.heldBy[0]?.count || 1;
                      return (
                        <li key={item.name}>
                          <span>{item.name}</span>
                          <span className="dashboard-bars__track">
                            <span style={{ width: `${(item.count / max) * 100}%` }} />
                          </span>
                          <strong>{item.count}</strong>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="dashboard-empty">No active files.</p>
                )}
              </Card.Body>
            </Card>

            <Card className="dashboard-panel">
              <Card.Header>
                <Card.Title subtitle="All registered cases">By error category</Card.Title>
              </Card.Header>
              <Card.Body>
                {data?.categoryBreakdown?.length ? (
                  <ul className="dashboard-bars dashboard-bars--neutral">
                    {data.categoryBreakdown.map((item) => {
                      const max = data.categoryBreakdown[0]?.count || 1;
                      return (
                        <li key={item.name}>
                          <span>{item.name}</span>
                          <span className="dashboard-bars__track">
                            <span style={{ width: `${(item.count / max) * 100}%` }} />
                          </span>
                          <strong>{item.count}</strong>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="dashboard-empty">No categories yet.</p>
                )}
              </Card.Body>
            </Card>

            <Card className="dashboard-panel dashboard-panel--full">
              <Card.Header action={<Link to="/files" className="dashboard-link">Open files <ArrowRightIcon size={14} /></Link>}>
                <Card.Title subtitle="Newest registrations">Recent files</Card.Title>
              </Card.Header>
              <Card.Body noPadding>
                <div className="dashboard-recent">
                  {data?.recentFiles?.length ? (
                    data.recentFiles.map((file) => (
                      <Link key={file.id} to={`/files/${file.id}`} className="dashboard-recent__item">
                        <span>
                          <strong>{file.reference}</strong>
                          <small>{file.consumerName}</small>
                        </span>
                        <span>
                          <FileStatusBadge status={file.status} overdue={file.overdue} />
                          <small>Registered {formatDate(file.registeredAt)}</small>
                        </span>
                      </Link>
                    ))
                  ) : (
                    <p className="dashboard-empty">No files registered yet.</p>
                  )}
                </div>
              </Card.Body>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default DashboardPage;
