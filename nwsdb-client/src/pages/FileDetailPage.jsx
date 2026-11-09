import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button/Button';
import { Card } from '../components/Card/Card';
import { FileStatusBadge } from '../components/FileStatusBadge/FileStatusBadge';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  FileTextIcon,
  PlusIcon,
  RefreshIcon,
  SwapIcon
} from '../components/Icons/Icons';
import { PageHeader } from '../components/PageHeader/PageHeader';
import { Timeline } from '../components/Timeline/Timeline';
import { ApprovalActionModal } from '../features/approvals/ApprovalActionModal';
import { ApprovalModal } from '../features/approvals/ApprovalModal';
import { CreateFileModal } from '../features/files/CreateFileModal';
import { HandoverModal } from '../features/files/HandoverModal';
import { ReceiveModal } from '../features/files/ReceiveModal';
import { useAuth } from '../hooks/useAuth';
import { listCategories } from '../services/categoryService';
import { listDepartments } from '../services/departmentService';
import { completeFile, getFile } from '../services/fileService';
import { listUserDirectory } from '../services/userService';
import {
  durationBetween,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDuration,
  formatMonth
} from '../utils/format';
import {
  canActOnApproval,
  canAddApprovals,
  canCompleteFiles,
  canEditFiles,
  getRoleLabel
} from '../utils/roles';
import './FileDetailPage.css';

export function FileDetailPage() {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const [file, setFile] = useState(null);
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [notice, setNotice] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [handoverOpen, setHandoverOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([
      getFile(fileId),
      listUserDirectory().catch(() => []),
      listDepartments().catch(() => []),
      listCategories().catch(() => [])
    ])
      .then(([nextFile, nextStaff, nextDepartments, nextCategories]) => {
        if (!active) {
          return;
        }
        setFile(nextFile);
        setStaff(nextStaff);
        setDepartments(nextDepartments);
        setCategories(nextCategories);
        setError('');
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Could not load this file.');
          setFile(null);
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
  }, [fileId, reloadKey]);

  function refresh(message) {
    if (message) {
      setNotice(message);
    }
    setReloadKey((value) => value + 1);
  }

  function departmentName(id) {
    return departments.find((department) => department.id === id)?.name || '';
  }

  function staffName(uid) {
    return staff.find((person) => person.uid === uid)?.displayName || '';
  }

  async function handleComplete() {
    if (!file) {
      return;
    }
    const confirmed = window.confirm(
      `Close ${file.reference}? Confirm the adjustment is complete and all receipts are recorded.`
    );
    if (!confirmed) {
      return;
    }

    setCompleting(true);
    try {
      await completeFile(file.id);
      refresh(`File ${file.reference} was closed.`);
    } catch (err) {
      setError(err.message || 'Could not close the file.');
    } finally {
      setCompleting(false);
    }
  }

  if (loading && !file) {
    return (
      <div className="file-detail">
        <div className="file-detail__loading">
          <RefreshIcon size={20} className="animate-spin" />
          Loading file…
        </div>
      </div>
    );
  }

  if (error && !file) {
    return (
      <div className="file-detail">
        <div className="files-alert" role="alert">
          {error}
        </div>
        <Button variant="outline" onClick={() => navigate('/files')}>
          Back to files
        </Button>
      </div>
    );
  }

  const movements = [...(file.movements || [])].sort(
    (left, right) => new Date(left.handoverAt).getTime() - new Date(right.handoverAt).getTime()
  );
  const approvals = file.approvals || [];
  const pendingMovement =
    movements.find((movement) => movement.id === file.pendingMovementId) ||
    movements.find((movement) => !movement.receiptAt);
  const lastMovement = movements[movements.length - 1];
  const isActive = !['completed', 'cancelled'].includes(file.status);
  const canReceive =
    Boolean(pendingMovement) &&
    (['admin', 'manager'].includes(role) || pendingMovement.toUid === user?.uid);
  const canHandover =
    ['admin', 'manager'].includes(role) || file.currentHolderUid === user?.uid;
  const actor = { uid: user?.uid, role };
  const pendingApprovalCount = approvals.filter((approval) => approval.status === 'pending').length;

  return (
    <div className="file-detail">
      <div className="file-detail__breadcrumb">
        <Link to="/files">Files</Link>
        <ArrowRightIcon size={12} />
        <span>{file.reference}</span>
      </div>

      <PageHeader
        eyebrow="Water bill adjustment file"
        title={file.reference}
        description={`${file.consumerName} · ${file.categoryName}${file.subCategoryName ? ` / ${file.subCategoryName}` : ''} · ${formatMonth(file.billMonth)} bill`}
        actions={
          <div className="file-detail__actions">
            {canEditFiles(role) && isActive && (
              <Button variant="outline" size="sm" icon={<FileTextIcon size={15} />} onClick={() => setEditOpen(true)}>
                Edit details
              </Button>
            )}
            {isActive && !pendingMovement && canHandover && (
              <Button variant="primary" size="sm" icon={<SwapIcon size={15} />} onClick={() => setHandoverOpen(true)}>
                Record handover
              </Button>
            )}
            {canReceive && (
              <Button variant="success" size="sm" icon={<CheckCircleIcon size={15} />} onClick={() => setReceiveOpen(true)}>
                Confirm receipt
              </Button>
            )}
            {canAddApprovals(role) && isActive && (
              <Button variant="outline" size="sm" icon={<PlusIcon size={15} />} onClick={() => setApprovalOpen(true)}>
                Add approval
              </Button>
            )}
            {canCompleteFiles(role) && isActive && !pendingMovement && (
              <Button
                variant="success"
                size="sm"
                icon={<CheckCircleIcon size={15} />}
                onClick={handleComplete}
                isLoading={completing}
                disabled={pendingApprovalCount > 0}
                title={pendingApprovalCount > 0 ? 'Action all pending approvals before completing the file.' : undefined}
              >
                Complete file
              </Button>
            )}
          </div>
        }
      />

      {notice && (
        <div className="file-detail__notice" role="status">
          {notice}
        </div>
      )}
      {error && (
        <div className="files-alert" role="alert">
          {error}
        </div>
      )}

      {pendingMovement && (
        <div className="file-detail__pending">
          <div>
            <strong>Receipt pending.</strong> The file was handed over to {pendingMovement.toName || 'the next officer'} on{' '}
            {formatDateTime(pendingMovement.handoverAt)} and has not been confirmed as received.
          </div>
          {canReceive && (
            <Button variant="success" size="sm" onClick={() => setReceiveOpen(true)}>
              Confirm receipt now
            </Button>
          )}
        </div>
      )}

      <div className="file-detail__facts">
        <div className="file-detail__fact">
          <span>Status</span>
          <FileStatusBadge status={file.status} overdue={file.overdue} />
        </div>
        <div className="file-detail__fact">
          <span>Current holder</span>
          <strong>{file.currentHolderName || 'Unassigned'}</strong>
          <small>{file.currentDepartmentName || departmentName(file.currentDepartmentId) || '—'}</small>
        </div>
        <div className="file-detail__fact">
          <span>Registered</span>
          <strong>{formatDate(file.registeredAt)}</strong>
          <small>by {file.registeredByName || '—'}</small>
        </div>
        <div className="file-detail__fact">
          <span>Due date</span>
          <strong className={file.overdue ? 'file-detail__overdue' : ''}>{formatDate(file.dueDate)}</strong>
          <small>{file.ageDays} day{file.ageDays === 1 ? '' : 's'} open</small>
        </div>
        <div className="file-detail__fact">
          <span>Approvals</span>
          <strong>
            {approvals.length - pendingApprovalCount}/{approvals.length || 0} complete
          </strong>
          <small>{pendingApprovalCount} pending</small>
        </div>
        <div className="file-detail__fact">
          <span>Priority</span>
          <strong className={file.priority === 'urgent' ? 'file-detail__overdue' : ''}>
            {file.priority === 'urgent' ? 'Urgent' : 'Normal'}
          </strong>
        </div>
      </div>

      <div className="file-detail__layout">
        <div className="file-detail__main">
          <Card>
            <Card.Header action={<span className="file-detail__card-count">{movements.length} movement{movements.length === 1 ? '' : 's'}</span>}>
              <Card.Title subtitle="Handover and receipt activity in chronological order">
                Movement history
              </Card.Title>
            </Card.Header>
            <Card.Body>
              {movements.length === 0 ? (
                <p className="file-detail__empty">
                  No movement has been recorded yet. The file is currently held by {file.currentHolderName}.
                </p>
              ) : (
                <Timeline>
                  {movements.map((movement, index) => {
                    const next = movements[index + 1];
                    const isCurrent = pendingMovement
                      ? movement.id === pendingMovement.id
                      : movement.id === lastMovement?.id;
                    const transit = movement.receiptAt
                      ? durationBetween(movement.handoverAt, movement.receiptAt)
                      : null;
                    const held = movement.receiptAt
                      ? durationBetween(
                          movement.receiptAt,
                          next?.handoverAt || file.completedAt || new Date()
                        )
                      : null;

                    return (
                      <Timeline.Item
                        key={movement.id}
                        status={movement.status}
                        fromPerson={movement.fromName || staffName(movement.fromUid)}
                        fromSection={departmentName(movement.fromDepartmentId)}
                        toPerson={movement.toName || staffName(movement.toUid)}
                        toSection={departmentName(movement.toDepartmentId)}
                        handoverTime={formatDateTime(movement.handoverAt)}
                        receiptTime={movement.receiptAt ? formatDateTime(movement.receiptAt) : null}
                        timeInTransit={transit !== null ? formatDuration(transit) : null}
                        timeHeld={held !== null ? formatDuration(held) : null}
                        delayReason={movement.delayReason}
                        notes={movement.notes}
                        recordedBy={staffName(movement.handoverByUid) || movement.fromName}
                        isCurrent={isCurrent}
                      />
                    );
                  })}
                </Timeline>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header
              action={
                canAddApprovals(role) && isActive ? (
                  <Button variant="ghost" size="sm" icon={<PlusIcon size={14} />} onClick={() => setApprovalOpen(true)}>
                    Add step
                  </Button>
                ) : null
              }
            >
              <Card.Title subtitle="Review and signature requirements for this adjustment">
                Approval steps
              </Card.Title>
            </Card.Header>
            <Card.Body>
              {approvals.length === 0 ? (
                <p className="file-detail__empty">
                  No approval steps have been added. {canAddApprovals(role) ? 'Add the required reviews before closing the file.' : ''}
                </p>
              ) : (
                <div className="approval-list">
                  {approvals.map((approval) => {
                    const actionable =
                      approval.status === 'pending' && canActOnApproval(actor, approval);
                    return (
                      <div key={approval.id} className="approval-list__item">
                        <div className="approval-list__sequence">{approval.sequence}</div>
                        <div className="approval-list__body">
                          <div className="approval-list__top">
                            <strong>{approval.title}</strong>
                            <FileStatusBadge status={approval.status} size="sm" />
                          </div>
                          <div className="approval-list__meta">
                            <span>{getRoleLabel(approval.assignedRole)}</span>
                            {approval.assignedUid && <span>· {staffName(approval.assignedUid) || 'Assigned officer'}</span>}
                            {approval.actionByName && (
                              <span>
                                · {approval.status === 'returned' ? 'Returned' : 'Actioned'} by {approval.actionByName} on{' '}
                                {formatDateTime(approval.actionAt)}
                              </span>
                            )}
                          </div>
                          {approval.comment && <p className="approval-list__comment">“{approval.comment}”</p>}
                          {actionable && (
                            <div className="approval-list__actions">
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => setApprovalAction({ approval, action: 'approved' })}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setApprovalAction({ approval, action: 'returned' })}
                              >
                                Return
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

        <div className="file-detail__side">
          <Card>
            <Card.Header>
              <Card.Title subtitle="Complaint and consumer information">File details</Card.Title>
            </Card.Header>
            <Card.Body>
              <dl className="file-detail__meta">
                <div>
                  <dt>Consumer</dt>
                  <dd>{file.consumerName}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{file.consumerPhone || '—'}</dd>
                </div>
                <div>
                  <dt>Address</dt>
                  <dd>{file.consumerAddress || '—'}</dd>
                </div>
                <div>
                  <dt>Complaint number</dt>
                  <dd>{file.complaintNo || '—'}</dd>
                </div>
                <div>
                  <dt>Billing month</dt>
                  <dd>{formatMonth(file.billMonth)}</dd>
                </div>
                <div>
                  <dt>Bill amount</dt>
                  <dd>{formatCurrency(file.billAmount)}</dd>
                </div>
                <div>
                  <dt>Requested adjustment</dt>
                  <dd>{formatCurrency(file.adjustmentAmount)}</dd>
                </div>
                <div>
                  <dt>Category</dt>
                  <dd>
                    {file.categoryName}
                    {file.subCategoryName ? ` / ${file.subCategoryName}` : ''}
                  </dd>
                </div>
                <div>
                  <dt>Description</dt>
                  <dd className="file-detail__description">{file.description}</dd>
                </div>
                {file.completedAt && (
                  <div>
                    <dt>Completed</dt>
                    <dd>{formatDateTime(file.completedAt)}</dd>
                  </div>
                )}
              </dl>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title subtitle="Where the physical file is now">Current position</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="file-detail__holder">
                <div className="file-detail__holder-avatar">
                  {(file.currentHolderName || '?').slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <strong>{file.currentHolderName || 'Unassigned'}</strong>
                  <span>{file.currentDepartmentName || departmentName(file.currentDepartmentId) || 'No department'}</span>
                  <small>
                    {pendingMovement
                      ? `Awaiting receipt since ${formatDateTime(pendingMovement.handoverAt)}`
                      : lastMovement?.receiptAt
                        ? `Held since ${formatDateTime(lastMovement.receiptAt)}`
                        : `Registered ${formatDateTime(file.registeredAt)}`}
                  </small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      {editOpen && (
        <CreateFileModal
          file={file}
          categories={categories}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            refresh('File details were updated.');
          }}
        />
      )}

      {handoverOpen && (
        <HandoverModal
          file={file}
          staff={staff}
          departments={departments}
          onClose={() => setHandoverOpen(false)}
          onSaved={() => {
            setHandoverOpen(false);
            refresh('Handover recorded. The recipient must now confirm receipt.');
          }}
        />
      )}

      {receiveOpen && pendingMovement && (
        <ReceiveModal
          file={file}
          movement={pendingMovement}
          onClose={() => setReceiveOpen(false)}
          onSaved={() => {
            setReceiveOpen(false);
            refresh('Receipt confirmed and the current holder was updated.');
          }}
        />
      )}

      {approvalOpen && (
        <ApprovalModal
          file={file}
          staff={staff}
          onClose={() => setApprovalOpen(false)}
          onSaved={() => {
            setApprovalOpen(false);
            refresh('Approval step added.');
          }}
        />
      )}

      {approvalAction && (
        <ApprovalActionModal
          file={file}
          approval={approvalAction.approval}
          action={approvalAction.action}
          onClose={() => setApprovalAction(null)}
          onSaved={() => {
            const wasReturn = approvalAction.action === 'returned';
            setApprovalAction(null);
            refresh(wasReturn ? 'File returned for correction.' : 'Approval recorded.');
          }}
        />
      )}
    </div>
  );
}

export default FileDetailPage;
