import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/Button/Button';
import { Card } from '../components/Card/Card';
import { FileStatusBadge } from '../components/FileStatusBadge/FileStatusBadge';
import { BuildingIcon, PlusIcon, RefreshIcon, SearchIcon } from '../components/Icons/Icons';
import { Input } from '../components/Input/Input';
import { Select } from '../components/Input/Select';
import { PageHeader } from '../components/PageHeader/PageHeader';
import { Table } from '../components/Table/Table';
import { DepartmentModal } from '../features/reference/DepartmentModal';
import { listDepartments } from '../services/departmentService';
import './ReferencePages.css';

export function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    let active = true;

    listDepartments()
      .then((rows) => {
        if (active) {
          setDepartments(rows);
          setError('');
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Could not load departments.');
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

  function refresh(message) {
    if (message) {
      setNotice(message);
    }
    setReloadKey((value) => value + 1);
  }

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return departments.filter((department) => {
      if (typeFilter && department.type !== typeFilter) {
        return false;
      }
      if (statusFilter === 'active' && department.active === false) {
        return false;
      }
      if (statusFilter === 'inactive' && department.active !== false) {
        return false;
      }
      if (!query) {
        return true;
      }
      return [department.name, department.code, department.type].join(' ').toLowerCase().includes(query);
    });
  }, [departments, search, typeFilter, statusFilter]);

  function parentName(id) {
    return departments.find((department) => department.id === id)?.name || '';
  }

  const types = [...new Set(departments.map((department) => department.type).filter(Boolean))].sort();

  return (
    <div className="reference-page">
      <PageHeader
        eyebrow="Reference data"
        title="Departments and sections"
        description="Manage the offices that files can be routed to. Disabling a department keeps historical movements intact."
        actions={
          <Button variant="primary" icon={<PlusIcon size={16} />} onClick={() => setCreating(true)}>
            Add department
          </Button>
        }
      />

      {notice && <div className="reference-page__notice">{notice}</div>}
      {error && (
        <div className="files-alert" role="alert">
          {error}
        </div>
      )}

      <div className="reference-page__stat">
        <BuildingIcon size={20} />
        <div>
          <strong>{departments.filter((department) => department.active !== false).length}</strong>
          <span>active departments</span>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-bar__field filter-bar__field--search">
          <span className="filter-bar__label">Search</span>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name or code…"
            leftIcon={<SearchIcon size={16} />}
          />
        </div>

        <div className="filter-bar__field">
          <span className="filter-bar__label">Type</span>
          <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="">All types</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </div>

        <div className="filter-bar__field">
          <span className="filter-bar__label">Status</span>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Disabled</option>
          </Select>
        </div>

        <div className="filter-bar__actions">
          <Button variant="outline" size="sm" icon={<RefreshIcon size={14} />} onClick={() => setReloadKey((value) => value + 1)}>
            Refresh
          </Button>
        </div>
      </div>

      <Card className="reference-table-card">
        <Card.Body noPadding>
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.HeaderCell>Department</Table.HeaderCell>
                <Table.HeaderCell>Code</Table.HeaderCell>
                <Table.HeaderCell>Type</Table.HeaderCell>
                <Table.HeaderCell>Parent</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell align="right">Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Head>
            <Table.Body emptyMessage={loading ? 'Loading departments…' : 'No departments match the filters.'}>
              {visible.map((department) => (
                <Table.Row key={department.id}>
                  <Table.Cell>
                    <strong>{department.name}</strong>
                  </Table.Cell>
                  <Table.Cell>{department.code}</Table.Cell>
                  <Table.Cell className="reference-page__capitalize">{department.type}</Table.Cell>
                  <Table.Cell>{parentName(department.parentId) || '—'}</Table.Cell>
                  <Table.Cell>
                    <FileStatusBadge status={department.active === false ? 'inactive' : 'active'} />
                  </Table.Cell>
                  <Table.Cell align="right">
                    <button type="button" className="reference-page__action" onClick={() => setEditing(department)}>
                      Edit
                    </button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card.Body>
      </Card>

      {creating && (
        <DepartmentModal
          departments={departments}
          onClose={() => setCreating(false)}
          onSaved={(saved) => {
            setCreating(false);
            refresh(`Department ${saved.name} was added.`);
          }}
        />
      )}

      {editing && (
        <DepartmentModal
          department={editing}
          departments={departments}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setEditing(null);
            refresh(`Department ${saved.name} was updated.`);
          }}
        />
      )}
    </div>
  );
}

export default DepartmentsPage;
