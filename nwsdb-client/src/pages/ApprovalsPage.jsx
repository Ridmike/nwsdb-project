import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button/Button';
import { Card } from '../components/Card/Card';
import { FileStatusBadge } from '../components/FileStatusBadge/FileStatusBadge';
import { CheckCircleIcon, SearchIcon } from '../components/Icons/Icons';
import { Input } from '../components/Input/Input';
import { Select } from '../components/Input/Select';
import { PageHeader } from '../components/PageHeader/PageHeader';
import { ApprovalActionModal } from '../features/approvals/ApprovalActionModal';
import { useAuth } from '../hooks/useAuth';
import { listApprovals } from '../services/approvalService';
import { formatDateTime } from '../utils/format';
import { canActOnApproval, getRoleLabel } from '../utils/roles';
import './ApprovalsPage.css';

const STATUS_OPTIONS = [
  { value: '', label: 'All approval steps' },
  { value: 'pending', label: 'Pending action' },
  { value: 'approved', label: 'Approved' },
  { value: 'returned', label: 'Returned' },
  { value: 'skipped', label: 'Skipped' }
];

export function ApprovalsPage() {
  const { user, role } = useAuth();
  const [status, setStatus] = useState('pending');
  const [mine, setMine] = useState(role !== 'admin' && role !== 'manager');
  const [search, setSearch] = useState('');
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionTarget, setActionTarget] = useState(null);

  useEffect(() => {
    let active = true;

    listApprovals({ status, mine: mine ? '1' : '' })
      .then((rows) => {
        if (active) {
          setApprovals(rows);
          setError('');
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Could not load approvals.');
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
  }, [status, mine, refreshKey]);

  const visibleApprovals = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return approvals;
    }
    return approvals.filter((approval) =>
      [
        approval.title,
        approval.fileReference,
        approval.consumerName,
        approval.currentHolderName,
        approval.assignedRole
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [approvals, search]);

  const pendingCount = approvals.filter((approval) => approval.status === 'pending').length;
  const actor = { uid: user?.uid, role };

  return (
    <div className="approvals-page">
      <PageHeader
        eyebrow="Review queue"
        title="Approvals"
        description="Review adjustment files assigned to your role. Approving a step records your name and the time of the decision."
        actions={
          <div className="approvals-page__headline-stat">
            <strong>{pendingCount}</strong>
            <span>pending step{pendingCount === 1 ? '' : 's'}</span>
          </div>
        }
      />

      <div className="filter-bar">
        <div className="filter-bar__field filter-bar__field--search">
          <span className="filter-bar__label">Search</span>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="File reference, consumer, or approval title…"
            leftIcon={<SearchIcon size={16} />}
          />
        </div>

        <div className="filter-bar__field">
          <span className="filter-bar__label">Status</span>
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <label className="nwsdb-checkbox">
          <input
            type="checkbox"
            checked={mine}
            onChange={(event) => setMine(event.target.checked)}
          />
          Assigned to me
        </label>

        <div className="filter-bar__actions">
          <Button variant="outline" size="sm" onClick={() => setRefreshKey((value) => value + 1)}>
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="files-alert" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="approvals-page__empty">Loading approvals…</div>
      ) : visibleApprovals.length === 0 ? (
        <Card className="approvals-page__empty-card">
          <Card.Body>
            <CheckCircleIcon size={28} />
            <h3>No approval steps match this view</h3>
            <p>
              There is nothing waiting for your role right now. Clear the filters or check back after a
              file is handed over.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <div className="approvals-list">
          {visibleApprovals.map((approval) => {
            const actionable = approval.status === 'pending' && canActOnApproval(actor, approval);
            return (
              <article key={approval.id} className="approval-card">
                <div className="approval-card__main">
                  <div className="approval-card__heading">
                    <div>
                      <Link to={`/files/${approval.fileId}`} className="approval-card__file">
                        {approval.fileReference || 'File'}
                      </Link>
                      <h3>{approval.title}</h3>
                    </div>
                    <FileStatusBadge status={approval.status} />
                  </div>

                  <div className="approval-card__grid">
                    <div>
                      <span>Consumer</span>
                      <strong>{approval.consumerName || '—'}</strong>
                    </div>
                    <div>
                      <span>Assigned role</span>
                      <strong>{getRoleLabel(approval.assignedRole)}</strong>
                    </div>
                    <div>
                      <span>Current holder</span>
                      <strong>{approval.currentHolderName || '—'}</strong>
                      <small>{approval.currentDepartmentName}</small>
                    </div>
                    <div>
                      <span>Requested</span>
                      <strong>{formatDateTime(approval.createdAt)}</strong>
                    </div>
                    {approval.actionAt && (
                      <div>
                        <span>Actioned</span>
                        <strong>{formatDateTime(approval.actionAt)}</strong>
                        <small>by {approval.actionByName}</small>
                      </div>
                    )}
                  </div>

                  {approval.comment && (
                    <p className="approval-card__comment">“{approval.comment}”</p>
                  )}
                </div>

                <div className="approval-card__side">
                  <Link to={`/files/${approval.fileId}`} className="approval-card__open">
                    Open file
                  </Link>
                  {actionable && (
                    <div className="approval-card__actions">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => setActionTarget({ approval, action: 'approved' })}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setActionTarget({ approval, action: 'returned' })}
                      >
                        Return
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {actionTarget && (
        <ApprovalActionModal
          file={{ id: actionTarget.approval.fileId, reference: actionTarget.approval.fileReference }}
          approval={actionTarget.approval}
          action={actionTarget.action}
          onClose={() => setActionTarget(null)}
          onSaved={() => {
            setActionTarget(null);
            setRefreshKey((value) => value + 1);
          }}
        />
      )}
    </div>
  );
}

export default ApprovalsPage;
