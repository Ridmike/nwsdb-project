import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/Button/Button';
import { Card } from '../components/Card/Card';
import { FileStatusBadge } from '../components/FileStatusBadge/FileStatusBadge';
import { PlusIcon, RefreshIcon, SearchIcon, UserIcon } from '../components/Icons/Icons';
import { FormField } from '../components/Input/FormField';
import { Input } from '../components/Input/Input';
import { Select } from '../components/Input/Select';
import { Modal } from '../components/Modal/Modal';
import { PageHeader } from '../components/PageHeader/PageHeader';
import { Table } from '../components/Table/Table';
import { UserModal } from '../features/users/UserModal';
import { useAuth } from '../hooks/useAuth';
import { listDepartments } from '../services/departmentService';
import { listUsers, resetUserPassword } from '../services/userService';
import { formatDate, formatDateTime } from '../utils/format';
import { getRoleLabel, ROLES } from '../utils/roles';
import './UsersPage.css';

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [resetResult, setResetResult] = useState(null);
  const [resettingUid, setResettingUid] = useState('');

  useEffect(() => {
    let active = true;

    Promise.all([listUsers(), listDepartments().catch(() => [])])
      .then(([nextUsers, nextDepartments]) => {
        if (active) {
          setUsers(nextUsers);
          setDepartments(nextDepartments);
          setError('');
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Could not load users.');
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

  const visibleUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((person) => {
      if (roleFilter && person.role !== roleFilter) {
        return false;
      }
      if (statusFilter === 'active' && person.active === false) {
        return false;
      }
      if (statusFilter === 'inactive' && person.active !== false) {
        return false;
      }
      if (!query) {
        return true;
      }
      return [person.displayName, person.email, person.section, person.office, person.username]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [users, search, roleFilter, statusFilter]);

  function refresh(message) {
    if (message) {
      setNotice(message);
    }
    setReloadKey((value) => value + 1);
  }

  async function handleReset(person) {
    setResettingUid(person.uid);
    setError('');
    try {
      const result = await resetUserPassword(
        person.uid,
        `${window.location.origin}/login`
      );
      setResetResult({ ...result, displayName: person.displayName });
    } catch (err) {
      setError(err.message || 'Could not generate a password reset link.');
    } finally {
      setResettingUid('');
    }
  }

  async function copyResetLink() {
    if (!resetResult?.resetLink) {
      return;
    }
    try {
      await navigator.clipboard.writeText(resetResult.resetLink);
      setNotice('Reset link copied to the clipboard.');
    } catch {
      setNotice('Copy the reset link manually from the dialog.');
    }
  }

  const activeCount = users.filter((person) => person.active !== false).length;

  return (
    <div className="users-page">
      <PageHeader
        eyebrow="Administration"
        title="Staff accounts"
        description="Create accounts, assign roles and sections, and disable access without deleting the audit history."
        actions={
          <Button variant="primary" icon={<PlusIcon size={16} />} onClick={() => setCreating(true)}>
            Add staff account
          </Button>
        }
      />

      {notice && (
        <div className="users-page__notice" role="status">
          {notice}
        </div>
      )}
      {error && (
        <div className="files-alert" role="alert">
          {error}
        </div>
      )}

      <div className="users-page__summary">
        <div>
          <UserIcon size={18} />
          <strong>{users.length}</strong>
          <span>total accounts</span>
        </div>
        <div>
          <span className="users-page__dot users-page__dot--active" />
          <strong>{activeCount}</strong>
          <span>active</span>
        </div>
        <div>
          <span className="users-page__dot users-page__dot--inactive" />
          <strong>{users.length - activeCount}</strong>
          <span>disabled</span>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-bar__field filter-bar__field--search">
          <span className="filter-bar__label">Search</span>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, email, section…"
            leftIcon={<SearchIcon size={16} />}
          />
        </div>

        <div className="filter-bar__field">
          <span className="filter-bar__label">Role</span>
          <Select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="">All roles</option>
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="filter-bar__field">
          <span className="filter-bar__label">Status</span>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All accounts</option>
            <option value="active">Active</option>
            <option value="inactive">Disabled</option>
          </Select>
        </div>

        <div className="filter-bar__actions">
          <Button variant="outline" size="sm" onClick={() => setReloadKey((value) => value + 1)} icon={<RefreshIcon size={14} />}>
            Refresh
          </Button>
        </div>
      </div>

      <Card className="users-table-card">
        <Card.Body noPadding>
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.HeaderCell>Staff member</Table.HeaderCell>
                <Table.HeaderCell>Role</Table.HeaderCell>
                <Table.HeaderCell>Section / office</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Last sign-in</Table.HeaderCell>
                <Table.HeaderCell align="right">Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Head>
            <Table.Body emptyMessage={loading ? 'Loading users…' : 'No staff accounts match the filters.'}>
              {visibleUsers.map((person) => (
                <Table.Row key={person.uid}>
                  <Table.Cell>
                    <span className="users-page__person">
                      <span className="users-page__avatar">
                        {(person.displayName || person.email || '?').slice(0, 1).toUpperCase()}
                      </span>
                      <span>
                        <strong>
                          {person.displayName || 'Unnamed account'}
                          {person.uid === currentUser?.uid && <em className="users-page__you">You</em>}
                        </strong>
                        <small>{person.email}</small>
                      </span>
                    </span>
                  </Table.Cell>
                  <Table.Cell>{getRoleLabel(person.role)}</Table.Cell>
                  <Table.Cell>
                    <span>{person.section || '—'}</span>
                    <small className="users-page__muted">{person.office || ''}</small>
                  </Table.Cell>
                  <Table.Cell>
                    <FileStatusBadge status={person.active === false ? 'inactive' : 'active'} />
                  </Table.Cell>
                  <Table.Cell>{person.lastSignInTime ? formatDateTime(person.lastSignInTime) : formatDate(person.createdAt)}</Table.Cell>
                  <Table.Cell align="right">
                    <span className="users-page__actions">
                      <button type="button" className="users-page__action" onClick={() => setEditing(person)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="users-page__action"
                        onClick={() => handleReset(person)}
                        disabled={resettingUid === person.uid}
                      >
                        {resettingUid === person.uid ? 'Working…' : 'Reset password'}
                      </button>
                    </span>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card.Body>
      </Card>

      {creating && (
        <UserModal
          departments={departments}
          onClose={() => setCreating(false)}
          onSaved={(saved) => {
            setCreating(false);
            refresh(`Account created for ${saved.displayName}. Share the temporary password securely.`);
          }}
        />
      )}

      {editing && (
        <UserModal
          user={editing}
          departments={departments}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setEditing(null);
            refresh(`Account updated for ${saved.displayName}. The user must sign in again to pick up role changes.`);
          }}
        />
      )}

      {resetResult && (
        <Modal
          isOpen
          onClose={() => setResetResult(null)}
          title="Password reset"
          subtitle={`Reset instructions for ${resetResult.displayName}`}
          size="md"
        >
          {resetResult.resetLink ? (
            <>
              <p className="form-note">
                Send this one-time link to the staff member. It is generated by Firebase and expires
                automatically. The user should not share it.
              </p>
              <FormField label="Reset link" id="reset-link">
                <Input id="reset-link" value={resetResult.resetLink} readOnly />
              </FormField>
              <div className="form-actions">
                <Button variant="outline" onClick={() => setResetResult(null)}>
                  Close
                </Button>
                <Button variant="primary" onClick={copyResetLink}>
                  Copy link
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="form-note">{resetResult.message || 'The reset link was generated.'}</p>
              <div className="form-actions">
                <Button variant="primary" onClick={() => setResetResult(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

export default UsersPage;
